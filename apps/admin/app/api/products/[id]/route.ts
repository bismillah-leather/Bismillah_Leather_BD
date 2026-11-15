import { getPrisma } from "@bismillah/db";
import { parseTakaToPaisa } from "@bismillah/shared";
import { NextResponse } from "next/server";
import { getActiveAdmin } from "@/lib/admin-auth";
import { uniqueSku } from "@/lib/catalog-write";
import { forgetAdminLists } from "@/lib/ttl-cache";

export async function DELETE(
  _request: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const admin = await getActiveAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const { id } = await ctx.params;
  const prisma = getPrisma();
  const existing = await prisma.product.findUnique({
    where: { id },
    select: { id: true, name: true, slug: true, deletedAt: true },
  });
  if (!existing || existing.deletedAt) {
    return NextResponse.json({ error: "Product not found." }, { status: 404 });
  }

  // Free unique slug/SKU so the same name can be re-added later.
  const freedSlug = `${existing.slug}-deleted-${Date.now().toString(36)}`.slice(0, 80);

  await prisma.$transaction(async (tx) => {
    const variants = await tx.productVariant.findMany({
      where: { productId: id },
      select: { id: true, sku: true },
    });
    for (const v of variants) {
      await tx.productVariant.update({
        where: { id: v.id },
        data: {
          isActive: false,
          sku: `${v.sku}-X-${Date.now().toString(36)}`.slice(0, 64),
        },
      });
    }
    await tx.product.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        status: "archived",
        isFeatured: false,
        slug: freedSlug,
      },
    });
    await tx.auditLog.create({
      data: {
        actorId: admin.sub,
        action: "product.delete",
        entityType: "Product",
        entityId: id,
        before: { name: existing.name, slug: existing.slug },
        after: { slug: freedSlug },
      },
    });
  });

  forgetAdminLists();
  return NextResponse.json({ ok: true });
}

export async function PATCH(
  request: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const admin = await getActiveAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const { id } = await ctx.params;
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const data: {
    name?: string;
    description?: string;
    isFeatured?: boolean;
    isNew?: boolean;
    primaryCategoryId?: string;
  } = {};

  if (typeof body.name === "string" && body.name.trim().length >= 2) {
    data.name = body.name.trim();
  }
  if (typeof body.description === "string") data.description = body.description.trim();
  if (typeof body.isFeatured === "boolean") data.isFeatured = body.isFeatured;
  if (typeof body.isNew === "boolean") data.isNew = body.isNew;
  if (typeof body.categoryId === "string" && body.categoryId) {
    data.primaryCategoryId = body.categoryId;
  }
  const sku =
    typeof body.sku === "string" ? body.sku.trim().toUpperCase() : "";

  const priceTaka =
    typeof body.priceTaka === "number"
      ? body.priceTaka
      : typeof body.priceTaka === "string"
        ? Number(body.priceTaka)
        : null;
  const stock =
    typeof body.stock === "number"
      ? body.stock
      : typeof body.stock === "string"
        ? Number(body.stock)
        : null;

  const hasPrice = priceTaka != null && Number.isFinite(priceTaka) && priceTaka > 0;
  const hasStock = stock != null && Number.isFinite(stock) && stock >= 0 && Number.isInteger(stock);
  const clearSale = body.salePriceTaka === null || body.salePriceTaka === "";
  const salePriceTaka =
    typeof body.salePriceTaka === "number"
      ? body.salePriceTaka
      : typeof body.salePriceTaka === "string" && body.salePriceTaka.trim() !== ""
        ? Number(body.salePriceTaka)
        : null;
  const hasSale =
    !clearSale && salePriceTaka != null && Number.isFinite(salePriceTaka) && salePriceTaka > 0;

  if (Object.keys(data).length === 0 && !hasPrice && !hasStock && !hasSale && !clearSale && !sku) {
    return NextResponse.json({ error: "Nothing to update." }, { status: 400 });
  }

  const prisma = getPrisma();
  const product =
    Object.keys(data).length > 0
      ? await prisma.product.update({
          where: { id },
          data,
          select: { id: true, name: true, isFeatured: true, isNew: true },
        })
      : await prisma.product.findUniqueOrThrow({
          where: { id },
          select: { id: true, name: true, isFeatured: true, isNew: true },
        });

  if (data.primaryCategoryId) {
    const category = await prisma.category.findFirst({
      where: { id: data.primaryCategoryId, deletedAt: null },
      select: { id: true },
    });
    if (!category) {
      return NextResponse.json({ error: "Category not found." }, { status: 404 });
    }
    await prisma.productCategory.deleteMany({ where: { productId: id } });
    await prisma.productCategory.create({
      data: { productId: id, categoryId: data.primaryCategoryId },
    });
  }

  if (hasPrice || hasStock || hasSale || clearSale || sku) {
    let variant = await prisma.productVariant.findFirst({
      where: { productId: id, isActive: true },
      orderBy: { createdAt: "asc" },
      select: { id: true, price: true },
    });

    let price: bigint | undefined;
    let salePrice: bigint | null | undefined;
    if (hasPrice) {
      try {
        price = parseTakaToPaisa(String(priceTaka));
      } catch {
        return NextResponse.json({ error: "Invalid price." }, { status: 400 });
      }
    }
    if (hasSale) {
      try {
        salePrice = parseTakaToPaisa(String(salePriceTaka));
      } catch {
        return NextResponse.json({ error: "Invalid sale price." }, { status: 400 });
      }
      const regular = price ?? variant?.price ?? 0n;
      if (salePrice >= regular) {
        return NextResponse.json(
          { error: "Sale price must be lower than the regular price." },
          { status: 400 },
        );
      }
    } else if (clearSale) {
      salePrice = null;
    }

    if (!variant) {
      const nextSku = await uniqueSku(
        prisma,
        sku || `BL-${product.id.replace(/-/g, "").slice(0, 8).toUpperCase()}`,
      );
      variant = await prisma.productVariant.create({
        data: {
          productId: id,
          sku: nextSku,
          price: price ?? 150000n,
          salePrice: salePrice ?? null,
          stockOnHand: hasStock ? Math.trunc(stock) : 0,
          isActive: true,
        },
        select: { id: true, price: true },
      });
    } else {
      await prisma.productVariant.update({
        where: { id: variant.id },
        data: {
          ...(price != null ? { price } : {}),
          ...(salePrice !== undefined ? { salePrice } : {}),
          ...(hasStock ? { stockOnHand: Math.trunc(stock) } : {}),
          ...(sku.length >= 3 ? { sku: await uniqueSku(prisma, sku, variant.id) } : {}),
        },
      });
    }
  }

  await prisma.auditLog.create({
    data: {
      actorId: admin.sub,
      action: "product.update",
      entityType: "Product",
      entityId: id,
      after: product,
    },
  });

  forgetAdminLists();
  return NextResponse.json({ ok: true, product });
}
