import { productBySlug, SHOWCASE_PRODUCTS, toProductView } from "@bismillah/shared";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ProductPhoto } from "@/components/leather-visual";
import { ProductBuy } from "@/components/product-buy";
import { ProductGrid } from "@/components/product-grid";

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

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 pb-28 sm:px-6 sm:pb-16">
      <p className="text-xs tracking-wide text-muted-foreground">
        <Link href="/" className="hover:text-foreground">
          Home
        </Link>
        <span aria-hidden="true"> / </span>
        <Link href={`/category/${product.categorySlug}`} className="hover:text-foreground">
          {product.categorySlug.replaceAll("-", " ")}
        </Link>
      </p>
      <div className="mt-4 grid items-start gap-8 lg:grid-cols-2 lg:gap-14">
        <div className="overflow-hidden bg-[#efeae3]">
          <ProductPhoto
            src={product.image}
            alt={product.name}
            priority
            sizes="(min-width: 1024px) 50vw, 100vw"
          />
        </div>
        <ProductBuy product={toProductView(product)} />
      </div>
      {related.length > 0 ? (
        <section className="mt-16">
          <h2 className="font-display text-3xl">You may also like</h2>
          <div className="mt-6">
            <ProductGrid products={related.slice(0, 4)} />
          </div>
        </section>
      ) : null}
    </div>
  );
}
