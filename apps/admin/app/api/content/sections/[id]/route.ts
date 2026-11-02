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
  let body: { isActive?: boolean; title?: string; sortOrder?: number };
  try {
    body = (await request.json()) as { isActive?: boolean; title?: string; sortOrder?: number };
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const data: { isActive?: boolean; title?: string; sortOrder?: number } = {};
  if (typeof body.isActive === "boolean") data.isActive = body.isActive;
  if (typeof body.title === "string") data.title = body.title.trim();
  if (typeof body.sortOrder === "number" && Number.isInteger(body.sortOrder)) {
    data.sortOrder = body.sortOrder;
  }
  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Nothing to update." }, { status: 400 });
  }

  const prisma = getPrisma();
  const section = await prisma.homeSection.update({
    where: { id },
    data,
    select: { id: true, key: true, isActive: true, title: true },
  });

  await prisma.auditLog.create({
    data: {
      actorId: admin.sub,
      action: "home_section.toggle",
      entityType: "HomeSection",
      entityId: id,
      after: section,
    },
  });

  return NextResponse.json({ ok: true, isActive: section.isActive });
}

export async function DELETE(
  _request: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const admin = await getActiveAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const { id } = await ctx.params;
  const prisma = getPrisma();
  const section = await prisma.homeSection.delete({
    where: { id },
    select: { id: true, key: true, title: true },
  });
  await prisma.auditLog.create({
    data: {
      actorId: admin.sub,
      action: "home_section.delete",
      entityType: "HomeSection",
      entityId: id,
      before: section,
    },
  });
  return NextResponse.json({ ok: true });
}
