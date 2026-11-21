import {
  customerBoughtProduct,
  getPrisma,
  parseReviewInput,
} from "@bismillah/db";
import { NextResponse } from "next/server";
import { getCustomerSession } from "@/lib/customer-session";
import { clientIp, hitRateLimit } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const ip = clientIp(request.headers);
  const limited = await hitRateLimit(`review:${ip}`, 8, 15 * 60 * 1000);
  if (!limited.ok) {
    return NextResponse.json({ error: "Too many reviews. Try again later." }, { status: 429 });
  }

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

  const prisma = getPrisma();
  const product = await prisma.product.findFirst({
    where: { id: parsed.productId, deletedAt: null, status: "published" },
    select: { id: true },
  });
  if (!product) {
    return NextResponse.json({ error: "Product not found." }, { status: 404 });
  }

  const session = await getCustomerSession();
  let customerId: string | null = session?.sub ?? null;
  let verified = false;
  let orderId: string | null = null;

  if (customerId) {
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      select: { id: true, isBlocked: true, name: true },
    });
    if (!customer || customer.isBlocked) customerId = null;
    else {
      const bought = await customerBoughtProduct(prisma, customer.id, product.id);
      verified = Boolean(bought);
      orderId = bought?.orderId ?? null;
      const existing = await prisma.review.findFirst({
        where: { productId: product.id, customerId: customer.id },
        select: { id: true, status: true },
      });
      if (existing) {
        const msg =
          existing.status === "pending"
            ? "You already sent a review. It is waiting for approval."
            : existing.status === "approved"
              ? "You already reviewed this product."
              : "This review was not approved. Message the shop if you need a change.";
        return NextResponse.json({ error: msg }, { status: 409 });
      }
    }
  }

  await prisma.review.create({
    data: {
      productId: product.id,
      customerId,
      orderId,
      rating: parsed.rating,
      title: parsed.title || null,
      body: parsed.body,
      authorName: parsed.authorName,
      authorCity: parsed.authorCity,
      authorEmail: parsed.authorEmail,
      authorAddress: parsed.authorAddress,
      photoUrls: parsed.photoUrls,
      status: "pending",
      isVerifiedPurchase: verified,
    },
  });

  return NextResponse.json({ ok: true, pending: true });
}
