import { BRAND, galleryFor, productBySlug, SHOWCASE_PRODUCTS, toProductView } from "@bismillah/shared";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ProductBuy } from "@/components/product-buy";
import { ProductGallery } from "@/components/product-gallery";
import { ProductGrid } from "@/components/product-grid";
import { TrustStrip } from "@/components/trust-strip";

export function generateStaticParams() {
  return SHOWCASE_PRODUCTS.map((product) => ({ slug: product.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = productBySlug(slug);
  if (!product) return { title: "Product" };
  return {
    title: product.name,
    description: product.blurb,
  };
}

export default function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  return (
    <Suspense fallback={<div className="px-4 py-10 text-muted-foreground">Loading product…</div>}>
      <ProductContent params={params} />
    </Suspense>
  );
}

async function ProductContent({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = productBySlug(slug);
  if (!product) notFound();

  const related = SHOWCASE_PRODUCTS.filter((item) => item.slug !== product.slug).slice(0, 4);
  const recentlyViewed = SHOWCASE_PRODUCTS.filter(
    (item) => item.kind === product.kind && item.slug !== product.slug,
  ).slice(0, 4);
  const categoryLabel = product.categorySlug.replaceAll("-", " ");

  return (
    <div className="pb-28 sm:pb-0">
      <section className="relative overflow-hidden border-b border-border bg-white">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 20%, #000 0.6px, transparent 0.7px), radial-gradient(circle at 80% 70%, #000 0.55px, transparent 0.65px)",
            backgroundSize: "28px 28px, 40px 40px",
          }}
        />

        <div className="relative mx-auto max-w-7xl px-3 py-6 sm:px-6 sm:py-10 lg:py-14">
          <nav aria-label="Breadcrumb" className="text-xs tracking-wide text-muted-foreground">
            <ol className="flex flex-wrap items-center gap-1.5">
              <li>
                <Link href="/" className="transition hover:text-foreground">
                  Home
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li>
                <Link
                  href={`/category/${product.categorySlug}`}
                  className="capitalize transition hover:text-foreground"
                >
                  {categoryLabel}
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li className="text-foreground">{product.name}</li>
            </ol>
          </nav>

          <div className="mt-6 grid items-start gap-8 lg:mt-10 lg:grid-cols-[1.08fr_0.92fr] lg:gap-14 xl:gap-16">
            <ProductGallery images={galleryFor(product)} alt={product.name} />
            <ProductBuy product={toProductView(product)} />
          </div>
        </div>
      </section>

      <section className="border-b border-border bg-secondary/40">
        <div className="mx-auto max-w-7xl px-3 py-10 sm:px-6 sm:py-14">
          <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr] lg:items-end">
            <div>
              <p className="text-xs tracking-[0.28em] text-muted-foreground uppercase">
                Craft & care
              </p>
              <h2 className="font-display mt-2 text-3xl tracking-tight sm:text-4xl">
                Built for daily carry
              </h2>
            </div>
            <p className="max-w-xl text-sm leading-7 text-muted-foreground">
              {product.blurb} Same piece you see on Facebook Reels — packed from {BRAND.addressShort}{" "}
              after a confirmation call.
            </p>
          </div>
          <div className="mt-8">
            <TrustStrip />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-3 py-12 sm:px-6 sm:py-16">
        <div className="flex flex-col items-start justify-between gap-5 border border-border bg-white p-6 sm:flex-row sm:items-center sm:p-8">
          <div>
            <p className="text-xs tracking-[0.22em] text-muted-foreground uppercase">Reviews</p>
            <h2 className="font-display mt-2 text-3xl tracking-tight">Customer reviews</h2>
            <p className="mt-2 max-w-md text-sm text-muted-foreground">
              Reviews open when orders go live. Be the first after your parcel arrives.
            </p>
          </div>
          <button
            type="button"
            disabled
            className="inline-flex h-12 items-center border border-foreground px-5 text-sm font-medium disabled:opacity-45"
          >
            Write a review
          </button>
        </div>
      </section>

      <section className="border-t border-border bg-white py-14 sm:py-20">
        <div className="mx-auto max-w-7xl px-3 sm:px-6">
          <div className="mb-8 flex flex-col gap-2 sm:mb-10 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs tracking-[0.28em] text-muted-foreground uppercase">
                Complete the look
              </p>
              <h2 className="font-display mt-2 text-3xl tracking-tight sm:text-4xl">
                You may also like
              </h2>
            </div>
            <Link
              href={`/category/${product.categorySlug}`}
              className="text-sm underline underline-offset-4"
            >
              More {categoryLabel}
            </Link>
          </div>
          <ProductGrid products={related} />
        </div>
      </section>

      {recentlyViewed.length > 0 ? (
        <section className="border-t border-border bg-secondary py-14 sm:py-20">
          <div className="mx-auto max-w-7xl px-3 sm:px-6">
            <p className="text-xs tracking-[0.28em] text-muted-foreground uppercase">Same style</p>
            <h2 className="font-display mt-2 text-3xl tracking-tight sm:text-4xl">
              More in this line
            </h2>
            <div className="mt-8 sm:mt-10">
              <ProductGrid products={recentlyViewed} />
            </div>
          </div>
        </section>
      ) : null}
    </div>
  );
}
