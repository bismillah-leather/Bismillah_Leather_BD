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
  let body: { isActive?: boolean };
  try {
    body = (await request.json()) as { isActive?: boolean };
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }
  if (typeof body.isActive !== "boolean") {
    return NextResponse.json({ error: "isActive required." }, { status: 400 });
  }

  const prisma = getPrisma();
  const coupon = await prisma.coupon.update({
    where: { id },
    data: { isActive: body.isActive },
    select: { id: true, code: true, isActive: true },
  });

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
