import { getPrisma } from "@bismillah/db";
import { NextResponse } from "next/server";
import { getActiveAdmin } from "@/lib/admin-auth";
import { adminMediaSrc, requestStoreOrigin } from "@/lib/media-url";

function slugify(input: string) {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

export async function GET() {
  const admin = await getActiveAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const prisma = getPrisma();
  const [origin, products] = await Promise.all([
    requestStoreOrigin(),
    prisma.product.findMany({
      where: { deletedAt: null },
      orderBy: { name: "asc" },
      take: 200,
      select: {
        id: true,
        name: true,
        slug: true,
        status: true,
        ogImageKey: true,
        media: {
          where: { type: "image" },
          orderBy: { sortOrder: "asc" },
          take: 1,
          select: { storageKey: true },
        },
        variants: {
          where: { isActive: true },
          take: 1,
          select: { sku: true, price: true },
        },
      },
    }),
  ]);

  return NextResponse.json({
    products: products.map((p) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      status: p.status,
      sku: p.variants[0]?.sku ?? "",
      pricePaisa: (p.variants[0]?.price ?? 0n).toString(),
      image: adminMediaSrc(p.media[0]?.storageKey || p.ogImageKey, origin) ?? "",
    })),
  });
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
  const categoryId = typeof body.categoryId === "string" ? body.categoryId : "";
  const sku = typeof body.sku === "string" ? body.sku.trim().toUpperCase() : "";
  const priceTaka = Number(body.priceTaka);
  const stock = Number(body.stock ?? 0);
  const status =
    body.status === "published" || body.status === "draft" ? body.status : "draft";
  const isFeatured = body.isFeatured === true;
  const slugRaw = typeof body.slug === "string" ? body.slug : name;
  const slug = slugify(slugRaw);

  if (name.length < 2) {
    return NextResponse.json({ error: "Name must be at least 2 characters." }, { status: 400 });
  }
  if (!slug) {
    return NextResponse.json({ error: "Valid slug required." }, { status: 400 });
  }
  if (!categoryId) {
    return NextResponse.json({ error: "Category required." }, { status: 400 });
  }
  if (!sku || sku.length < 3) {
    return NextResponse.json({ error: "SKU must be at least 3 characters." }, { status: 400 });
  }
  if (!Number.isFinite(priceTaka) || priceTaka <= 0) {
    return NextResponse.json({ error: "Price must be a positive taka amount." }, { status: 400 });
  }
  if (!Number.isInteger(stock) || stock < 0) {
    return NextResponse.json({ error: "Stock must be a non-negative integer." }, { status: 400 });
  }

  const prisma = getPrisma();
  const category = await prisma.category.findFirst({
    where: { id: categoryId, deletedAt: null, isActive: true },
    select: { id: true },
  });
  if (!category) {
    return NextResponse.json({ error: "Category not found." }, { status: 404 });
  }

  const pricePaisa = BigInt(Math.round(priceTaka * 100));

  try {
    const product = await prisma.$transaction(async (tx) => {
      const created = await tx.product.create({
        data: {
          name,
          slug,
          description,
          status,
          publishedAt: status === "published" ? new Date() : null,
          primaryCategoryId: categoryId,
          isFeatured,
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
          after: { name: created.name, slug: created.slug, status: created.status, sku, priceTaka, stock },
        },
      });
      return created;
    });

    return NextResponse.json({ ok: true, product });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[admin] product.create failed:", message);
    const conflict =
      /unique|duplicate|already exists/i.test(message) ||
      (typeof err === "object" &&
        err !== null &&
        "code" in err &&
        (err as { code?: string }).code === "P2002");
    return NextResponse.json(
      {
        error: conflict
          ? "Slug or SKU already exists."
          : "Could not create product.",
      },
      { status: conflict ? 409 : 500 },
    );
  }
}
