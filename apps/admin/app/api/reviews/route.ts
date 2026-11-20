import { getPrisma, parseReviewInput, syncProductRating } from "@bismillah/db";
import { NextResponse } from "next/server";
import { getActiveAdmin } from "@/lib/admin-auth";
import { forgetAdminLists } from "@/lib/ttl-cache";

export async function POST(request: Request) {
  const admin = await getActiveAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const parsed = parseReviewInput(body);
  if ("error" in parsed) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const publish = body.publish !== false && body.status !== "pending";
  const prisma = getPrisma();
  const product = await prisma.product.findFirst({
    where: { id: parsed.productId, deletedAt: null },
    select: { id: true },
  });
  if (!product) return NextResponse.json({ error: "Product not found." }, { status: 404 });

  const review = await prisma.review.create({
    data: {
      productId: product.id,
      rating: parsed.rating,
      title: parsed.title || null,
      body: parsed.body,
      authorName: parsed.authorName,
      authorCity: parsed.authorCity,
      authorEmail: parsed.authorEmail,
      authorAddress: parsed.authorAddress,
      photoUrls: parsed.photoUrls,
      status: publish ? "approved" : "pending",
      isVerifiedPurchase: body.verified === true,
    },
    select: { id: true, status: true },
  });

  if (review.status === "approved") {
    await syncProductRating(prisma, product.id);
  }
  await prisma.auditLog.create({
    data: {
      actorId: admin.sub,
      action: "review.create",
      entityType: "Review",
      entityId: review.id,
      after: { productId: product.id, status: review.status, rating: parsed.rating },
    },
  });
  forgetAdminLists();
  return NextResponse.json({ ok: true, id: review.id, status: review.status });
}
