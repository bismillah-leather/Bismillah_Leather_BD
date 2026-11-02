import { getPrisma } from "@bismillah/db";
import { NextResponse } from "next/server";
import { getActiveAdmin } from "@/lib/admin-auth";

export async function PATCH(
  request: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const admin = await getActiveAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const { id } = await ctx.params;
  let body: {
    isActive?: boolean;
    code?: string;
    type?: string;
    amount?: number;
    productIds?: unknown;
  };
  try {
    body = (await request.json()) as {
      isActive?: boolean;
      code?: string;
      type?: string;
      amount?: number;
      productIds?: unknown;
    };
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const data: {
    isActive?: boolean;
    code?: string;
    type?: "percent" | "fixed";
    value?: bigint;
    scope?: "all" | "product";
  } = {};
  if (typeof body.isActive === "boolean") data.isActive = body.isActive;
  if (typeof body.code === "string" && body.code.trim().length >= 3) {
    data.code = body.code.trim().toUpperCase();
  }
  if (body.type === "percent" || body.type === "fixed") data.type = body.type;
  if (typeof body.amount === "number" && Number.isFinite(body.amount) && body.amount > 0) {
    if (body.type === "percent" && body.amount > 100) {
      return NextResponse.json({ error: "Percent cannot be more than 100." }, { status: 400 });
    }
    data.value = BigInt(Math.round(body.amount * 100));
  }
  const productIds = Array.isArray(body.productIds)
    ? [...new Set(body.productIds.filter((item) => typeof item === "string" && item.length > 0))]
    : null;
  if (Object.keys(data).length === 0 && productIds == null) {
    return NextResponse.json({ error: "Nothing to update." }, { status: 400 });
  }

  const prisma = getPrisma();
  const linked = productIds
    ? await prisma.product.findMany({
        where: { id: { in: productIds }, deletedAt: null },
        select: { id: true },
      })
    : [];
  if (productIds) data.scope = linked.length ? "product" : "all";

  let coupon: { id: string; code: string; isActive: boolean };
  try {
    coupon = await prisma.$transaction(async (tx) => {
      const updated = await tx.coupon.update({
        where: { id },
        data,
        select: { id: true, code: true, isActive: true },
      });
      if (productIds) {
        await tx.couponProduct.deleteMany({ where: { couponId: id } });
        if (linked.length) {
          await tx.couponProduct.createMany({
            data: linked.map((product) => ({ couponId: id, productId: product.id })),
          });
        }
      }
      return updated;
    });
  } catch {
    return NextResponse.json({ error: "Could not update coupon. Code may already exist." }, { status: 409 });
  }

  await prisma.auditLog.create({
    data: {
      actorId: admin.sub,
      action: "coupon.toggle",
      entityType: "Coupon",
      entityId: id,
      after: coupon,
    },
  });

  return NextResponse.json({ ok: true, isActive: coupon.isActive });
}

export async function DELETE(
  _request: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const admin = await getActiveAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const { id } = await ctx.params;
  const prisma = getPrisma();
  const used = await prisma.couponRedemption.count({ where: { couponId: id } });
  if (used > 0) {
    return NextResponse.json(
      { error: "This coupon was already used. Turn it off instead of deleting it." },
      { status: 409 },
    );
  }

  const coupon = await prisma.coupon.delete({
    where: { id },
    select: { id: true, code: true },
  });
  await prisma.auditLog.create({
    data: {
      actorId: admin.sub,
      action: "coupon.delete",
      entityType: "Coupon",
      entityId: id,
      before: coupon,
    },
  });
  return NextResponse.json({ ok: true });
}
