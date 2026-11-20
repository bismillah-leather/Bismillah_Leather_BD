import { Prisma } from "./generated/prisma/client";
import type { PrismaClient } from "./generated/prisma/client";

export type PublicReview = {
  id: string;
  rating: number;
  title: string;
  body: string;
  authorName: string;
  authorCity: string;
  photos: string[];
  verified: boolean;
  createdAt: string;
  productName: string;
  productSlug: string;
  productImage: string;
};

const publicSelect = {
  id: true,
  rating: true,
  title: true,
  body: true,
  authorName: true,
  authorCity: true,
  photoUrls: true,
  isVerifiedPurchase: true,
  createdAt: true,
  product: {
    select: {
      name: true,
      slug: true,
      ogImageKey: true,
      media: {
        where: { type: "image" },
        orderBy: { sortOrder: "asc" as const },
        take: 1,
        select: { storageKey: true },
      },
    },
  },
} satisfies Prisma.ReviewSelect;

function displayName(name: string) {
  const trimmed = name.trim();
  return trimmed || "Customer";
}

function mapPublic(row: {
  id: string;
  rating: number;
  title: string | null;
  body: string;
  authorName: string;
  authorCity: string;
  photoUrls: Prisma.JsonValue;
  isVerifiedPurchase: boolean;
  createdAt: Date;
  product: {
    name: string;
    slug: string;
    ogImageKey: string | null;
    media: Array<{ storageKey: string }>;
  };
}): PublicReview {
  return {
    id: row.id,
    rating: row.rating,
    title: row.title?.trim() ?? "",
    body: row.body,
    authorName: displayName(row.authorName),
    authorCity: row.authorCity.trim(),
    photos: Array.isArray(row.photoUrls)
      ? row.photoUrls.filter((item): item is string => typeof item === "string" && item.length > 0).slice(0, 4)
      : [],
    verified: row.isVerifiedPurchase,
    createdAt: row.createdAt.toISOString(),
    productName: row.product.name,
    productSlug: row.product.slug,
    productImage: row.product.media[0]?.storageKey || row.product.ogImageKey || "",
  };
}

export async function syncProductRating(prisma: PrismaClient, productId: string) {
  const agg = await prisma.review.aggregate({
    where: { productId, status: "approved" },
    _avg: { rating: true },
    _count: { _all: true },
  });
  const avg = agg._avg.rating ?? 0;
  await prisma.product.update({
    where: { id: productId },
    data: {
      ratingAvg: new Prisma.Decimal(avg.toFixed(2)),
      ratingCount: agg._count._all,
    },
  });
}

export async function listApprovedReviewsForProduct(prisma: PrismaClient, productId: string) {
  const rows = await prisma.review.findMany({
    where: { productId, status: "approved" },
    orderBy: { createdAt: "desc" },
    take: 40,
    select: publicSelect,
  });
  return rows.map(mapPublic);
}

export async function listApprovedHomeReviews(prisma: PrismaClient, take = 12) {
  const rows = await prisma.review.findMany({
    where: { status: "approved", product: { deletedAt: null, status: "published" } },
    orderBy: { createdAt: "desc" },
    take,
    select: publicSelect,
  });
  return rows.map(mapPublic);
}

export async function customerBoughtProduct(
  prisma: PrismaClient,
  customerId: string,
  productId: string,
) {
  const hit = await prisma.orderItem.findFirst({
    where: {
      variant: { productId },
      order: {
        customerId,
        OR: [{ fulfillmentStatus: "delivered" }, { status: "completed" }],
      },
    },
    select: { id: true, orderId: true },
  });
  return hit;
}

export function parseReviewInput(body: Record<string, unknown>) {
  const rating = Number(body.rating);
  const authorName = typeof body.authorName === "string" ? body.authorName.trim() : "";
  const authorCity = typeof body.authorCity === "string" ? body.authorCity.trim() : "";
  const authorEmail = typeof body.authorEmail === "string" ? body.authorEmail.trim() : "";
  const authorAddress = typeof body.authorAddress === "string" ? body.authorAddress.trim() : "";
  const title = typeof body.title === "string" ? body.title.trim() : "";
  const text = typeof body.body === "string" ? body.body.trim() : "";
  const productId = typeof body.productId === "string" ? body.productId.trim() : "";
  const photoUrls = Array.isArray(body.photoUrls)
    ? body.photoUrls.filter((item): item is string => typeof item === "string" && /^(https?:\/\/|\/uploads\/)/.test(item)).slice(0, 4)
    : [];

  if (!productId) return { error: "Pick a product." };
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return { error: "Rating must be 1 to 5 stars." };
  }
  if (authorName.length < 2 || authorName.length > 60) {
    return { error: "Name should be 2–60 characters." };
  }
  if (authorCity.length > 40) return { error: "City is too long." };
  if (authorEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(authorEmail)) {
    return { error: "Enter a valid email, or leave it blank." };
  }
  if (authorAddress.length > 160) return { error: "Address is too long." };
  if (title.length > 80) return { error: "Title is too long." };
  if (text.length < 12 || text.length > 800) {
    return { error: "Review should be 12–800 characters." };
  }
  return {
    rating,
    authorName,
    authorCity,
    authorEmail,
    authorAddress,
    title,
    body: text,
    productId,
    photoUrls,
  };
}
