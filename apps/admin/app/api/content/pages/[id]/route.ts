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
  let body: { isPublished?: boolean; title?: string; body?: string };
  try {
    body = (await request.json()) as { isPublished?: boolean; title?: string; body?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const data: { isPublished?: boolean; title?: string; body?: string } = {};
  if (typeof body.isPublished === "boolean") data.isPublished = body.isPublished;
  if (typeof body.title === "string" && body.title.trim()) data.title = body.title.trim();
  if (typeof body.body === "string") data.body = body.body;

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Nothing to update." }, { status: 400 });
  }

  const prisma = getPrisma();
  const page = await prisma.page.update({
    where: { id },
    data,
    select: { id: true, slug: true, isPublished: true, title: true },
  });

  await prisma.auditLog.create({
    data: {
      actorId: admin.sub,
      action: "page.update",
      entityType: "Page",
      entityId: id,
      after: page,
    },
  });

  return NextResponse.json({ ok: true, page });
}
