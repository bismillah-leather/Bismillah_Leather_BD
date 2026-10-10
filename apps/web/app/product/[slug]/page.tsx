import { galleryFor, productBySlug, SHOWCASE_PRODUCTS, toProductView } from "@bismillah/shared";
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

  return (
    <div className="pb-28 sm:pb-10">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <p className="text-xs tracking-wide text-muted-foreground">
          <Link href="/" className="hover:text-foreground">
            Home
          </Link>
          <span aria-hidden="true"> / </span>
          <Link href={`/category/${product.categorySlug}`} className="hover:text-foreground">
            {product.categorySlug.replaceAll("-", " ")}
          </Link>
          <span aria-hidden="true"> / </span>
          <span>{product.name}</span>
        </p>

        <div className="mt-5 grid items-start gap-8 lg:grid-cols-2 lg:gap-14">
          <ProductGallery images={galleryFor(product)} alt={product.name} />
          <ProductBuy product={toProductView(product)} />
        </div>
      </div>

      <div className="mt-10 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <TrustStrip />
        </div>
      </div>

      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
        <div className="flex flex-col items-start justify-between gap-4 border border-border bg-white p-6 sm:flex-row sm:items-center sm:p-8">
          <div>
            <h2 className="font-display text-3xl">Customer reviews</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Reviews open when orders go live. Be the first after your parcel arrives.
            </p>
          </div>
          <button
            type="button"
            disabled
            className="inline-flex h-12 items-center bg-foreground px-5 text-sm font-medium text-background disabled:opacity-50"
          >
            Write a review
          </button>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-14 sm:px-6">
        <h2 className="text-center text-xs tracking-[0.28em] text-muted-foreground uppercase">
          You may also like
        </h2>
        <div className="mt-8">
          <ProductGrid products={related} />
        </div>
      </section>

      {recentlyViewed.length > 0 ? (
        <section className="border-t border-border bg-secondary py-14">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <h2 className="font-display text-3xl sm:text-4xl">More in this style</h2>
            <div className="mt-8">
              <ProductGrid products={recentlyViewed} />
            </div>
          </div>
        </section>
      ) : null}
    </div>
  );
}
