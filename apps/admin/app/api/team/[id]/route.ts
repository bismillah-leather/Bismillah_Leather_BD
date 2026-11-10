import { getPrisma } from "@bismillah/db";
import { NextResponse } from "next/server";
import { forgetAdminCache, getActiveAdmin, type AdminRoleName } from "@/lib/admin-auth";

const ASSIGNABLE = new Set<AdminRoleName>(["manager", "staff", "support"]);

function canManageTeam(role: string) {
  return role === "owner" || role === "manager";
}

export async function PATCH(
  request: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const admin = await getActiveAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  if (!canManageTeam(admin.role)) {
    return NextResponse.json({ error: "Only owners and managers can manage team." }, { status: 403 });
  }

  const { id } = await ctx.params;
  if (id === admin.sub) {
    return NextResponse.json({ error: "Use Account to edit your own profile." }, { status: 400 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const prisma = getPrisma();
  const target = await prisma.adminUser.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      lockedUntil: true,
    },
  });
  if (!target) return NextResponse.json({ error: "Staff not found." }, { status: 404 });

  if (target.role === "owner") {
    return NextResponse.json({ error: "Owner account cannot be changed here." }, { status: 403 });
  }
  if (admin.role === "manager" && target.role === "manager") {
    return NextResponse.json({ error: "Managers cannot edit other managers." }, { status: 403 });
  }

  const data: {
    isActive?: boolean;
    role?: AdminRoleName;
    lockedUntil?: null;
    failedLoginCount?: number;
  } = {};

  if (typeof body.isActive === "boolean") {
    data.isActive = body.isActive;
  }

  if (typeof body.role === "string") {
    if (admin.role !== "owner") {
      return NextResponse.json({ error: "Only owners can change roles." }, { status: 403 });
    }
    const role = body.role as AdminRoleName;
    if (!ASSIGNABLE.has(role)) {
      return NextResponse.json({ error: "Role must be manager, staff, or support." }, { status: 400 });
    }
    data.role = role;
  }

  if (body.unlock === true) {
    data.lockedUntil = null;
    data.failedLoginCount = 0;
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Nothing to update." }, { status: 400 });
  }

  forgetAdminCache(id);
  const updated = await prisma.adminUser.update({
    where: { id },
    data,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      lockedUntil: true,
    },
  });

  await prisma.auditLog.create({
    data: {
      actorId: admin.sub,
      action: "admin.team_update",
      entityType: "AdminUser",
      entityId: id,
      before: {
        role: target.role,
        isActive: target.isActive,
        locked: Boolean(target.lockedUntil),
      },
      after: {
        role: updated.role,
        isActive: updated.isActive,
        locked: Boolean(updated.lockedUntil),
      },
    },
  });

  return NextResponse.json({ ok: true, user: updated });
}
