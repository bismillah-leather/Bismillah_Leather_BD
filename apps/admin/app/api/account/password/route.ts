import { getPrisma } from "@bismillah/db";
import { NextResponse } from "next/server";
import {
  getActiveAdmin,
  hashAdminPassword,
  verifyAdminPassword,
} from "@/lib/admin-auth";

export async function POST(request: Request) {
  const admin = await getActiveAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const currentPassword =
    typeof body.currentPassword === "string" ? body.currentPassword : "";
  const newPassword = typeof body.newPassword === "string" ? body.newPassword : "";

  if (newPassword.length < 8) {
    return NextResponse.json(
      { error: "New password must be at least 8 characters." },
      { status: 400 },
    );
  }
  if (newPassword === currentPassword) {
    return NextResponse.json(
      { error: "New password must be different from the current one." },
      { status: 400 },
    );
  }

  const prisma = getPrisma();
  const user = await prisma.adminUser.findUnique({
    where: { id: admin.sub },
    select: { id: true, passwordHash: true },
  });
  if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const valid = await verifyAdminPassword(user.passwordHash, currentPassword);
  if (!valid) {
    return NextResponse.json({ error: "Current password is incorrect." }, { status: 401 });
  }

  const passwordHash = await hashAdminPassword(newPassword);
  await prisma.adminUser.update({
    where: { id: user.id },
    data: {
      passwordHash,
      failedLoginCount: 0,
      lockedUntil: null,
    },
  });

  await prisma.auditLog.create({
    data: {
      actorId: admin.sub,
      action: "admin.password_change",
      entityType: "AdminUser",
      entityId: admin.sub,
    },
  });

  return NextResponse.json({ ok: true });
}
