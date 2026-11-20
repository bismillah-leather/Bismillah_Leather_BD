import { getPrisma, syncProductRating } from "@bismillah/db";
import { NextResponse } from "next/server";
import { getActiveAdmin } from "@/lib/admin-auth";
import { forgetAdminLists } from "@/lib/ttl-cache";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const admin = await getActiveAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const { id } = await params;
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const status = body.status === "approved" || body.status === "rejected" ? body.status : null;
  if (!status) return NextResponse.json({ error: "status must be approved or rejected." }, { status: 400 });

  const prisma = getPrisma();
  const current = await prisma.review.findUnique({
    where: { id },
    select: { id: true, productId: true, status: true },
  });
  if (!current) return NextResponse.json({ error: "Review not found." }, { status: 404 });

  await prisma.review.update({
    where: { id },
    data: { status },
  });
  await syncProductRating(prisma, current.productId);
  await prisma.auditLog.create({
    data: {
      actorId: admin.sub,
      action: `review.${status}`,
      entityType: "Review",
      entityId: id,
      before: { status: current.status },
      after: { status },
    },
  });
  forgetAdminLists();
  return NextResponse.json({ ok: true, status });
}
