import { getPrisma } from "@bismillah/db";
import { NextResponse } from "next/server";
import { getActiveAdmin } from "@/lib/admin-auth";
import { setAdminSessionCookie, signAdminSession } from "@/lib/session";

export async function PATCH(request: Request) {
  const admin = await getActiveAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (name.length < 2) {
    return NextResponse.json({ error: "Name must be at least 2 characters." }, { status: 400 });
  }

  const prisma = getPrisma();
  const user = await prisma.adminUser.update({
    where: { id: admin.sub },
    data: { name },
    select: { id: true, name: true, email: true, role: true },
  });

  await prisma.auditLog.create({
    data: {
      actorId: admin.sub,
      action: "admin.profile_update",
      entityType: "AdminUser",
      entityId: admin.sub,
      after: { name: user.name },
    },
  });

  const token = await signAdminSession({
    sub: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  });
  await setAdminSessionCookie(token);

  return NextResponse.json({ ok: true, user });
}
