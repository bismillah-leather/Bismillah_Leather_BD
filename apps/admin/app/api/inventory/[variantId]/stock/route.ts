import { getPrisma } from "@bismillah/db";
import { NextResponse } from "next/server";
import { getActiveAdmin } from "@/lib/admin-auth";
import { forgetAdminLists } from "@/lib/ttl-cache";

export async function PATCH(
  request: Request,
  ctx: { params: Promise<{ variantId: string }> },
) {
  const admin = await getActiveAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const { variantId } = await ctx.params;
  let body: { stockOnHand?: number; note?: string };
  try {
    body = (await request.json()) as { stockOnHand?: number; note?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const next = Number(body.stockOnHand);
  if (!Number.isFinite(next) || next < 0 || !Number.isInteger(next)) {
    return NextResponse.json({ error: "stockOnHand must be a non-negative integer." }, { status: 400 });
  }

  const prisma = getPrisma();
  const variant = await prisma.productVariant.findUnique({
    where: { id: variantId },
    select: { id: true, stockOnHand: true, sku: true },
  });
  if (!variant) return NextResponse.json({ error: "Variant not found." }, { status: 404 });

  const delta = next - variant.stockOnHand;
  if (delta === 0) return NextResponse.json({ ok: true, stockOnHand: next });

  await prisma.$transaction([
    prisma.productVariant.update({
      where: { id: variantId },
      data: { stockOnHand: next },
    }),
    prisma.inventoryMovement.create({
      data: {
        variantId,
        delta,
        reason: delta > 0 ? "restock" : "adjustment",
        actorId: admin.sub,
        note: body.note?.trim() || `Set stock to ${next}`,
      },
    }),
    prisma.auditLog.create({
      data: {
        actorId: admin.sub,
        action: "inventory.set_stock",
        entityType: "ProductVariant",
        entityId: variantId,
        before: { stockOnHand: variant.stockOnHand },
        after: { stockOnHand: next, sku: variant.sku },
      },
    }),
  ]);

  forgetAdminLists();
  return NextResponse.json({ ok: true, stockOnHand: next });
}
