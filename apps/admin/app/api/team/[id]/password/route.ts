import { getPrisma } from "@bismillah/db";
import { NextResponse } from "next/server";
import { getActiveAdmin, hashAdminPassword } from "@/lib/admin-auth";

function canManageTeam(role: string) {
  return role === "owner" || role === "manager";
}

export async function POST(
  request: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const admin = await getActiveAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  if (!canManageTeam(admin.role)) {
    return NextResponse.json({ error: "Only owners and managers can reset passwords." }, { status: 403 });
  }

  const { id } = await ctx.params;
  if (id === admin.sub) {
    return NextResponse.json(
      { error: "Change your own password from Account." },
      { status: 400 },
    );
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const newPassword = typeof body.newPassword === "string" ? body.newPassword : "";
  if (newPassword.length < 8) {
    return NextResponse.json(
      { error: "Password must be at least 8 characters." },
      { status: 400 },
    );
  }

  const prisma = getPrisma();
  const target = await prisma.adminUser.findUnique({
    where: { id },
    select: { id: true, email: true, role: true },
  });
  if (!target) return NextResponse.json({ error: "Staff not found." }, { status: 404 });
  if (target.role === "owner") {
    return NextResponse.json({ error: "Cannot reset owner password here." }, { status: 403 });
  }
  if (admin.role === "manager" && target.role === "manager") {
    return NextResponse.json({ error: "Managers cannot reset other managers." }, { status: 403 });
  }

  const passwordHash = await hashAdminPassword(newPassword);
  await prisma.adminUser.update({
    where: { id },
    data: {
      passwordHash,
      failedLoginCount: 0,
      lockedUntil: null,
    },
  });

  await prisma.auditLog.create({
    data: {
      actorId: admin.sub,
      action: "admin.password_reset",
      entityType: "AdminUser",
      entityId: id,
      after: { email: target.email },
    },
  });

  return NextResponse.json({ ok: true });
}
