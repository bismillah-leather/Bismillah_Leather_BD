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
  let body: { isBlocked?: boolean };
  try {
    body = (await request.json()) as { isBlocked?: boolean };
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }
  if (typeof body.isBlocked !== "boolean") {
    return NextResponse.json({ error: "isBlocked required." }, { status: 400 });
  }

  const prisma = getPrisma();
  const customer = await prisma.customer.update({
    where: { id },
    data: { isBlocked: body.isBlocked },
    select: { id: true, isBlocked: true, phone: true },
  });

  await prisma.auditLog.create({
    data: {
      actorId: admin.sub,
      action: body.isBlocked ? "customer.block" : "customer.unblock",
      entityType: "Customer",
      entityId: id,
      after: { phone: customer.phone, isBlocked: customer.isBlocked },
    },
  });

  return NextResponse.json({ ok: true, isBlocked: customer.isBlocked });
}
