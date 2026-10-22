import { categoryBySlug, INITIAL_CATEGORIES } from "@bismillah/shared";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ProductGrid } from "@/components/product-grid";
import { productsByCategorySlug } from "@/lib/catalog";

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

export default function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ sort?: string | string[] }>;
}) {
  return (
    <Suspense fallback={<div className="px-4 py-10 text-muted-foreground">Loading category…</div>}>
      <CategoryContent params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function CategoryContent({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ sort?: string | string[] }>;
}) {
  const { slug } = await params;
  const query = await searchParams;
  const category = categoryBySlug(slug);
  if (!category) notFound();

  const sortRaw = Array.isArray(query.sort) ? query.sort[0] : query.sort;
  const sort = sortRaw ?? "relevant";
  let products = [...(await productsByCategorySlug(slug))];
  if (sort === "price-asc") {
    products = products.sort((a, b) => Number((a.salePaisa ?? a.pricePaisa) - (b.salePaisa ?? b.pricePaisa)));
  } else if (sort === "price-desc") {
    products = products.sort((a, b) => Number((b.salePaisa ?? b.pricePaisa) - (a.salePaisa ?? a.pricePaisa)));
  } else if (sort === "newest") {
    products = products.reverse();
  }

  const cover = products[0]?.image;
  const sorts = [
    { value: "relevant", label: "Most relevant" },
    { value: "newest", label: "Newest" },
    { value: "price-asc", label: "Price: low to high" },
    { value: "price-desc", label: "Price: high to low" },
  ] as const;

  return (
    <div>
      <div className="relative min-h-[55vh] overflow-hidden bg-black text-white sm:min-h-[60vh]">
        {cover ? (
          <Image src={cover} alt="" fill sizes="100vw" className="object-cover opacity-55" priority />
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/25 to-black/80" />
        <div className="relative mx-auto flex min-h-[55vh] max-w-7xl flex-col justify-end px-4 pt-32 pb-10 sm:min-h-[60vh] sm:px-6 sm:pt-36 sm:pb-14">
          <p className="text-xs tracking-wide text-white/75">
            <Link href="/" className="hover:text-white">
              Home
            </Link>
            <span aria-hidden="true"> / </span>
            {category.name}
          </p>
          <h1 className="font-display mt-2 text-4xl leading-none tracking-tight sm:text-6xl lg:text-7xl">
            {category.name}
          </h1>
          <p className="mt-3 max-w-xl text-sm text-white/80">{category.blurb}</p>
        </div>
      </div>

      <div className="sticky top-[var(--site-header-offset,7rem)] z-40 border-b border-border bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-3 py-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-3 sm:px-6">
          <p className="shrink-0 text-sm text-muted-foreground">
            {products.length} {products.length === 1 ? "product" : "products"}
          </p>
          <div className="-mx-3 flex gap-2 overflow-x-auto px-3 pb-0.5 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0">
            {sorts.map((option) => (
              <Link
                key={option.value}
                href={`/category/${slug}?sort=${option.value}`}
                className={`inline-flex h-9 shrink-0 items-center border px-3 text-xs whitespace-nowrap sm:h-10 sm:text-sm ${
                  sort === option.value
                    ? "border-foreground bg-foreground text-background"
                    : "border-input bg-white"
                }`}
              >
                {option.label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <ProductGrid products={products} />
      </div>
    </div>
  );
}
