import { categoryBySlug, INITIAL_CATEGORIES, productsByCategory } from "@bismillah/shared";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ProductGrid } from "@/components/product-grid";

export function generateStaticParams() {
  return INITIAL_CATEGORIES.map((category) => ({ slug: category.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const category = categoryBySlug(slug);
  if (!category) return { title: "Category" };
  return { title: category.name, description: category.blurb };
}

export default function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  return (
    <Suspense fallback={<div className="px-4 py-10 text-muted-foreground">Loading category…</div>}>
      <CategoryContent params={params} />
    </Suspense>
  );
}

async function CategoryContent({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const category = categoryBySlug(slug);
  if (!category) notFound();
  const products = productsByCategory(slug);

  const cover = products[0]?.image;

  return (
    <div>
      <div className="relative min-h-72 overflow-hidden bg-foreground text-background sm:min-h-96">
        {cover ? (
          <Image src={cover} alt="" fill sizes="100vw" className="object-cover opacity-55" priority />
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/55 to-black/25" />
        <div className="relative mx-auto flex min-h-72 max-w-7xl flex-col justify-end px-4 py-10 sm:min-h-96 sm:px-6">
          <p className="text-xs tracking-wide text-white/75">
            <Link href="/" className="hover:text-white">
              Home
            </Link>
            <span aria-hidden="true"> / </span>
            {category.name}
          </p>
          <h1 className="font-display mt-2 text-5xl sm:text-7xl">{category.name}</h1>
          <p className="mt-3 max-w-xl text-sm text-white/80">{category.blurb}</p>
        </div>
      </div>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <p className="mb-6 text-sm text-muted-foreground">
          {products.length} {products.length === 1 ? "product" : "products"}
        </p>
        <ProductGrid products={products} />
      </div>
    </div>
  );
}
