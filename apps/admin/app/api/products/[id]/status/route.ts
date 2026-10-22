import { getPrisma } from "@bismillah/db";
import { NextResponse } from "next/server";
import { getActiveAdmin } from "@/lib/admin-auth";

const ALLOWED = new Set(["draft", "scheduled", "published", "archived"]);

export async function PATCH(
  request: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const admin = await getActiveAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const { id } = await ctx.params;
  let body: { status?: string };
  try {
    body = (await request.json()) as { status?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const status = body.status ?? "";
  if (!ALLOWED.has(status)) {
    return NextResponse.json({ error: "Invalid status." }, { status: 400 });
  }

  const prisma = getPrisma();
  const product = await prisma.product.update({
    where: { id },
    data: {
      status: status as "draft" | "scheduled" | "published" | "archived",
      publishedAt: status === "published" ? new Date() : undefined,
    },
    select: { id: true, status: true, slug: true },
  });

  await prisma.auditLog.create({
    data: {
      actorId: admin.sub,
      action: "product.set_status",
      entityType: "Product",
      entityId: id,
      after: product,
    },
  });

  return NextResponse.json({ ok: true, status: product.status });
}
