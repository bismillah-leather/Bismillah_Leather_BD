import { getPrisma } from "@bismillah/db";
import { NextResponse } from "next/server";
import { getActiveAdmin } from "@/lib/admin-auth";

export async function POST(request: Request) {
  const admin = await getActiveAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const code = typeof body.code === "string" ? body.code.trim().toUpperCase() : "";
  const type = body.type === "percent" || body.type === "fixed" ? body.type : null;
  const amount = Number(body.amount);
  if (!code || code.length < 3) {
    return NextResponse.json({ error: "Code must be at least 3 characters." }, { status: 400 });
  }
  if (!type) return NextResponse.json({ error: "type must be percent or fixed." }, { status: 400 });
  if (!Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json({ error: "amount must be positive." }, { status: 400 });
  }

  // percent: store basis points (15% → 1500). fixed: taka → paisa.
  const value =
    type === "percent" ? BigInt(Math.round(amount * 100)) : BigInt(Math.round(amount * 100));

  const prisma = getPrisma();
  try {
    const coupon = await prisma.coupon.create({
      data: {
        code,
        type,
        value,
        isActive: true,
        scope: "all",
      },
      select: { id: true, code: true },
    });
    await prisma.auditLog.create({
      data: {
        actorId: admin.sub,
        action: "coupon.create",
        entityType: "Coupon",
        entityId: coupon.id,
        after: { code: coupon.code, type, amount },
      },
    });
    return NextResponse.json({ ok: true, id: coupon.id, code: coupon.code });
  } catch {
    return NextResponse.json({ error: "Could not create coupon (code may exist)." }, { status: 409 });
  }
}
