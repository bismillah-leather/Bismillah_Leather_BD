import { getPrisma } from "@bismillah/db";
import { NextResponse } from "next/server";
import { getActiveAdmin } from "@/lib/admin-auth";

export async function POST(request: Request) {
  const admin = await getActiveAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  let body: { slug?: string; title?: string; body?: string };
  try {
    body = (await request.json()) as { slug?: string; title?: string; body?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const slug = typeof body.slug === "string" ? body.slug.trim().toLowerCase().replace(/\s+/g, "-") : "";
  const title = typeof body.title === "string" ? body.title.trim() : "";
  const pageBody = typeof body.body === "string" ? body.body : "";
  if (slug.length < 2 || title.length < 2) {
    return NextResponse.json({ error: "slug and title required." }, { status: 400 });
  }

  const prisma = getPrisma();
  try {
    const page = await prisma.page.create({
      data: { slug, title, body: pageBody, isPublished: false },
      select: { id: true, slug: true },
    });
    await prisma.auditLog.create({
      data: {
        actorId: admin.sub,
        action: "page.create",
        entityType: "Page",
        entityId: page.id,
        after: page,
      },
    });
    return NextResponse.json({ ok: true, id: page.id });
  } catch {
    return NextResponse.json({ error: "Could not create page (slug may exist)." }, { status: 409 });
  }
}
