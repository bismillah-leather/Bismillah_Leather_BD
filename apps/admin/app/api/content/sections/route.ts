import { getPrisma } from "@bismillah/db";
import { NextResponse } from "next/server";
import { getActiveAdmin } from "@/lib/admin-auth";

export async function POST(request: Request) {
  const admin = await getActiveAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  let body: { key?: string; title?: string; type?: string };
  try {
    body = (await request.json()) as { key?: string; title?: string; type?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const key = typeof body.key === "string" ? body.key.trim().toLowerCase().replace(/\s+/g, "-") : "";
  const title = typeof body.title === "string" ? body.title.trim() : "";
  const type = typeof body.type === "string" && body.type.trim() ? body.type.trim() : "custom";
  if (key.length < 2 || title.length < 2) {
    return NextResponse.json({ error: "Key and title are required." }, { status: 400 });
  }

  const prisma = getPrisma();
  const last = await prisma.homeSection.findFirst({
    orderBy: { sortOrder: "desc" },
    select: { sortOrder: true },
  });

  try {
    const section = await prisma.homeSection.create({
      data: {
        key,
        title,
        type,
        sortOrder: (last?.sortOrder ?? 0) + 1,
        isActive: true,
      },
      select: { id: true, key: true },
    });
    await prisma.auditLog.create({
      data: {
        actorId: admin.sub,
        action: "home_section.create",
        entityType: "HomeSection",
        entityId: section.id,
        after: section,
      },
    });
    return NextResponse.json({ ok: true, id: section.id });
  } catch {
    return NextResponse.json({ error: "Could not add section (key may exist)." }, { status: 409 });
  }
}
