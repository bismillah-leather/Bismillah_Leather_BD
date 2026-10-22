import { getPrisma } from "@bismillah/db";
import { NextResponse } from "next/server";
import { getActiveAdmin } from "@/lib/admin-auth";

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
    primaryCategoryId?: string;
  } = {};

  if (typeof body.name === "string" && body.name.trim().length >= 2) {
    data.name = body.name.trim();
  }
  if (typeof body.description === "string") data.description = body.description.trim();
  if (typeof body.isFeatured === "boolean") data.isFeatured = body.isFeatured;
  if (typeof body.categoryId === "string" && body.categoryId) {
    data.primaryCategoryId = body.categoryId;
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Nothing to update." }, { status: 400 });
  }

  const prisma = getPrisma();
  const product = await prisma.product.update({
    where: { id },
    data,
    select: { id: true, name: true, isFeatured: true },
  });

  await prisma.auditLog.create({
    data: {
      actorId: admin.sub,
      action: "product.update",
      entityType: "Product",
      entityId: id,
      after: product,
    },
  });

  return NextResponse.json({ ok: true, product });
}
