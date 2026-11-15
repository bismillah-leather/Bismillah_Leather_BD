import { getPrisma } from "@bismillah/db";
import { NextResponse } from "next/server";
import { getActiveAdmin } from "@/lib/admin-auth";
import { loadCatalogPicker } from "@/lib/catalog-picker";
import { ensureCategory, slugify, uniqueProductSlug, uniqueSku } from "@/lib/catalog-write";
import { requestStoreOrigin } from "@/lib/media-url";
import { forgetAdminLists } from "@/lib/ttl-cache";

export async function GET() {
  const admin = await getActiveAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const origin = await requestStoreOrigin();
  const products = await loadCatalogPicker(origin);
  return NextResponse.json({ products });
}

export async function POST(request: Request) {
  const admin = await getActiveAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const description = typeof body.description === "string" ? body.description.trim() : "";
  const categoryIdRaw = typeof body.categoryId === "string" ? body.categoryId : "";
  const categoryName = typeof body.categoryName === "string" ? body.categoryName.trim() : "";
  const skuRaw = typeof body.sku === "string" ? body.sku.trim().toUpperCase() : "";
  const priceTaka = Number(body.priceTaka);
  const stock = Number(body.stock ?? 0);
  const status =
    body.status === "draft" || body.status === "archived" ? body.status : "published";
  const isFeatured = body.isFeatured === true;
  const isNew = body.isNew === true;
  const slugRaw = typeof body.slug === "string" ? body.slug : name;

  if (name.length < 2) {
    return NextResponse.json({ error: "Name must be at least 2 characters." }, { status: 400 });
  }
  if (!Number.isFinite(priceTaka) || priceTaka <= 0) {
    return NextResponse.json({ error: "Price must be a positive taka amount." }, { status: 400 });
  }
  if (!Number.isInteger(stock) || stock < 0) {
    return NextResponse.json({ error: "Stock must be a non-negative integer." }, { status: 400 });
  }

  const prisma = getPrisma();
  const pricePaisa = BigInt(Math.round(priceTaka * 100));

  try {
    const product = await prisma.$transaction(async (tx) => {
      const categoryId = await ensureCategory(tx, {
        categoryId: categoryIdRaw || undefined,
        categoryName,
      });
      const slug = await uniqueProductSlug(tx, slugify(slugRaw) || name);
      const skuSeed =
        skuRaw ||
        `BL-${slug.replace(/-/g, "").slice(0, 8).toUpperCase() || "ITEM"}-${Math.floor(Math.random() * 90 + 10)}`;
      const sku = await uniqueSku(tx, skuSeed);

      const created = await tx.product.create({
        data: {
          name,
          slug,
          description,
          status,
          publishedAt: status === "published" ? new Date() : null,
          primaryCategoryId: categoryId,
          isFeatured,
          isNew,
          categories: { create: [{ categoryId }] },
          variants: {
            create: {
              sku,
              price: pricePaisa,
              stockOnHand: stock,
              isActive: true,
            },
          },
        },
        select: { id: true, name: true, slug: true, status: true },
      });
      await tx.auditLog.create({
        data: {
          actorId: admin.sub,
          action: "product.create",
          entityType: "Product",
          entityId: created.id,
          after: {
            name: created.name,
            slug: created.slug,
            status: created.status,
            sku,
            priceTaka,
            stock,
          },
        },
      });
      return created;
    });

    forgetAdminLists();
    return NextResponse.json({ ok: true, product });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[admin] product.create failed:", message);
    return NextResponse.json({ error: "Could not create product." }, { status: 500 });
  }
}
