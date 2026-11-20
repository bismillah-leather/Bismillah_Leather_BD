import { getPrisma } from "@bismillah/db";
import { AdminPageHeader } from "@/components/admin-page-header";
import { requireAdmin } from "@/lib/admin-auth";
import { ReviewActions } from "./review-actions";
import { ReviewCreateForm } from "./review-create-form";

export default async function ReviewsPage() {
  const prisma = getPrisma();
  const [, reviews, products] = await Promise.all([
    requireAdmin(),
    prisma.review.findMany({
      orderBy: { createdAt: "desc" },
      take: 120,
      select: {
        id: true,
        rating: true,
        title: true,
        body: true,
        authorName: true,
        authorCity: true,
        status: true,
        isVerifiedPurchase: true,
        createdAt: true,
        product: { select: { name: true, slug: true } },
      },
    }),
    prisma.product.findMany({
      where: { deletedAt: null },
      orderBy: { name: "asc" },
      take: 200,
      select: { id: true, name: true },
    }),
  ]);

  const rank = (status: string) => (status === "pending" ? 0 : status === "approved" ? 1 : 2);
  const sorted = [...reviews].sort((a, b) => rank(a.status) - rank(b.status));
  const pending = reviews.filter((row) => row.status === "pending").length;

  return (
    <div>
      <AdminPageHeader
        eyebrow="Storefront"
        title="Reviews"
        description="Customer reviews stay hidden until you approve them. Rejected reviews never show on the shop or homepage."
      />

      <p className="mt-4 text-sm text-muted-foreground">
        {pending} waiting · {reviews.filter((row) => row.status === "approved").length} live
      </p>

      <div className="mt-8 max-w-3xl">
        <h2 className="font-display text-xl tracking-tight">Add a review</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Use this for a shop-written review. Leave “Publish now” on to show it immediately.
        </p>
        <div className="mt-4">
          <ReviewCreateForm products={products} />
        </div>
      </div>

      <ul className="admin-panel mt-8 divide-y divide-border">
        {sorted.length === 0 ? (
          <li className="px-4 py-10 text-sm text-muted-foreground">No reviews yet.</li>
        ) : (
          sorted.map((review) => (
            <li key={review.id} className="grid gap-3 px-4 py-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start">
              <div>
                <p className="text-[11px] tracking-[0.16em] text-muted-foreground uppercase">
                  {review.status} · {review.rating}★ · {review.product.name}
                  {review.isVerifiedPurchase ? " · verified" : ""}
                </p>
                <p className="mt-1 font-medium">
                  {review.authorName || "Customer"}
                  {review.authorCity ? ` · ${review.authorCity}` : ""}
                </p>
                {review.title ? <p className="mt-1 text-sm">{review.title}</p> : null}
                <p className="mt-1 text-sm leading-6 text-muted-foreground">{review.body}</p>
                <p className="mt-2 text-[11px] text-muted-foreground">
                  {review.createdAt.toLocaleString()} · /product/{review.product.slug}
                </p>
              </div>
              <ReviewActions id={review.id} status={review.status} />
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
