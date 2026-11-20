import { getPrisma, listApprovedReviewsForProduct } from "@bismillah/db";
import { galleryFor, SHOWCASE_PRODUCTS, toProductView } from "@bismillah/shared";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { JsonLd } from "@/components/json-ld";
import { ProductBuy } from "@/components/product-buy";
import { ProductGallery } from "@/components/product-gallery";
import { ProductGrid } from "@/components/product-grid";
import { ProductInfoSection } from "@/components/product-info-section";
import { ProductReviews } from "@/components/product-reviews";
import { TrustStrip } from "@/components/trust-strip";
import { getPublishedProduct, listPublishedProducts } from "@/lib/catalog";
import { getCustomerSession } from "@/lib/customer-session";
import { videoUrlForSlug } from "@/lib/product-videos-store";
import { absoluteUrl, publicStoreOrigin } from "@/lib/site-origin";
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
  const [product, origin] = await Promise.all([getPublishedProduct(slug), publicStoreOrigin()]);
  if (!product) return { title: "Product" };
  const price = Number(product.salePaisa ?? product.pricePaisa) / 100;
  const description =
    product.blurb ||
    `${product.name} — genuine leather from Bismillah Leather, Mirpur-10, Dhaka. Cash on delivery across Bangladesh.`;
  const image = absoluteUrl(origin, product.image);
  const url = `${origin}/product/${product.slug}`;
  return {
    title: `${product.name} | leather ${product.kind} Bangladesh`,
    description,
    keywords: [
      product.name,
      `leather ${product.kind}`,
      "leather wallet bangladesh",
      "genuine leather dhaka",
      product.categorySlug.replaceAll("-", " "),
    ],
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      url,
      title: product.name,
      description,
      images: [{ url: image, alt: product.name }],
    },
    twitter: { card: "summary_large_image", title: product.name, description, images: [image] },
    other: { "product:price:amount": String(price), "product:price:currency": "BDT" },
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
  const [product, catalog, origin, brand, session] = await Promise.all([
    getPublishedProduct(slug),
    listPublishedProducts(),
    publicStoreOrigin(),
    getStoreBrand(),
    getCustomerSession(),
  ]);
  if (!product) notFound();
  const reviews = product.id
    ? await listApprovedReviewsForProduct(getPrisma(), product.id).catch(() => [])
    : [];

  const videoUrl = await videoUrlForSlug(slug, product.videoUrl);
  const view = toProductView(product, { videoUrl });

  const related = catalog.filter((item) => item.slug !== product.slug).slice(0, 4);
  const recentlyViewed = catalog
    .filter((item) => item.kind === product.kind && item.slug !== product.slug)
    .slice(0, 4);
  const categoryLabel = product.categorySlug.replaceAll("-", " ");

  const unit = Number(product.salePaisa ?? product.pricePaisa) / 100;
  const productLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    image: [absoluteUrl(origin, product.image)],
    description: product.blurb || view.blurb,
    sku: product.sku,
    brand: {
      "@type": "Brand",
      name: brand.name,
      logo: absoluteUrl(origin, "/brand/logo.png"),
    },
    category: categoryLabel,
    ...(reviews.length
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: (
              reviews.reduce((sum, row) => sum + row.rating, 0) / reviews.length
            ).toFixed(1),
            reviewCount: reviews.length,
          },
          review: reviews.slice(0, 8).map((row) => ({
            "@type": "Review",
            reviewBody: row.body,
            name: row.title || undefined,
            reviewRating: { "@type": "Rating", ratingValue: row.rating, bestRating: 5 },
            author: { "@type": "Person", name: row.authorName },
          })),
        }
      : {}),
    offers: {
      "@type": "Offer",
      url: `${origin}/product/${product.slug}`,
      priceCurrency: "BDT",
      price: unit.toFixed(2),
      availability: product.inStock
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition",
      seller: { "@type": "Organization", name: brand.name },
    },
  };

  return (
    <div className="pb-28 sm:pb-0">
      <JsonLd data={productLd} />
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
            <ProductGallery
              images={galleryFor(product)}
              alt={product.name}
              slug={product.slug}
              isNew={product.isNew}
            />
            <ProductBuy product={view} categoryLabel={categoryLabel} />
          </div>
        </div>
      </section>

      <section className="border-b border-border bg-white py-8 sm:py-12">
        <div className="mx-auto max-w-7xl px-3 sm:px-6">
          <ProductInfoSection product={view} />
        </div>
      </section>

      {product.id ? (
        <ProductReviews
          productId={product.id}
          reviews={reviews}
          highlights={view.highlights}
          customerName={session?.name}
        />
      ) : null}

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
