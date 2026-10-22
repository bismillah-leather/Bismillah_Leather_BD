import { galleryFor, SHOWCASE_PRODUCTS, toProductView } from "@bismillah/shared";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ProductBuy } from "@/components/product-buy";
import { ProductGallery } from "@/components/product-gallery";
import { ProductGrid } from "@/components/product-grid";
import { ProductInfoSection } from "@/components/product-info-section";
import { TrustStrip } from "@/components/trust-strip";
import { getPublishedProduct, listPublishedProducts } from "@/lib/catalog";
import { videoUrlForSlug } from "@/lib/product-videos-store";
import { getStoreBrand } from "@/lib/store-brand";

export function generateStaticParams() {
  return SHOWCASE_PRODUCTS.map((product) => ({ slug: product.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getPublishedProduct(slug);
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
  const [product, catalog, brand] = await Promise.all([
    getPublishedProduct(slug),
    listPublishedProducts(),
    getStoreBrand(),
  ]);
  if (!product) notFound();

  const videoUrl = await videoUrlForSlug(slug, product.videoUrl);
  const view = toProductView(product, { videoUrl });

  const related = catalog.filter((item) => item.slug !== product.slug).slice(0, 4);
  const recentlyViewed = catalog
    .filter((item) => item.kind === product.kind && item.slug !== product.slug)
    .slice(0, 4);
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

          <div className="mt-6 grid gap-8 lg:grid-cols-2 lg:gap-12">
            <ProductGallery images={galleryFor(product)} name={product.name} />
            <div>
              <p className="text-[10px] tracking-[0.28em] text-muted-foreground uppercase">
                {product.kind} · {categoryLabel}
              </p>
              <h1 className="font-display mt-2 text-3xl tracking-tight sm:text-4xl">{product.name}</h1>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                {product.blurb} Same piece you see on Facebook Reels — packed from {brand.addressShort}{" "}
                after a confirmation call.
              </p>
              <div className="mt-6">
                <ProductBuy product={view} />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-border bg-white py-8 sm:py-12">
        <div className="mx-auto max-w-7xl px-3 sm:px-6">
          <ProductInfoSection product={view} />
        </div>
      </section>

      <section className="border-b border-border bg-secondary py-8 sm:py-10">
        <div className="mx-auto max-w-7xl px-3 sm:px-6">
          <TrustStrip />
        </div>
      </section>

      {related.length > 0 ? (
        <section className="bg-white py-10 sm:py-14">
          <div className="mx-auto max-w-7xl px-3 sm:px-6">
            <h2 className="font-display text-2xl tracking-tight">You may also like</h2>
            <div className="mt-6">
              <ProductGrid products={related} />
            </div>
          </div>
        </section>
      ) : null}

      {recentlyViewed.length > 0 ? (
        <section className="border-t border-border bg-white py-10 sm:py-14">
          <div className="mx-auto max-w-7xl px-3 sm:px-6">
            <h2 className="font-display text-2xl tracking-tight">More in {product.kind}</h2>
            <div className="mt-6">
              <ProductGrid products={recentlyViewed} />
            </div>
          </div>
        </section>
      ) : null}
    </div>
  );
}
