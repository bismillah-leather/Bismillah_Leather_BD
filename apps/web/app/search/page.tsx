import { INITIAL_CATEGORIES, SHOWCASE_PRODUCTS, searchProducts } from "@bismillah/shared";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { CategoryPillsBar, categoryPillClass } from "@/components/category-pills";
import { ProductGrid } from "@/components/product-grid";

export const metadata: Metadata = {
  title: "Shop all",
  robots: { index: false, follow: true },
};

export default function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string | string[] }>;
}) {
  return (
    <Suspense fallback={<div className="px-4 py-10 text-muted-foreground">Loading…</div>}>
      <SearchResults searchParams={searchParams} />
    </Suspense>
  );
}

async function SearchResults({
  searchParams,
}: {
  searchParams: Promise<{ q?: string | string[] }>;
}) {
  const params = await searchParams;
  const raw = params.q;
  const query = (Array.isArray(raw) ? raw[0] : raw)?.trim() ?? "";
  const products =
    query.toLowerCase() === "sale"
      ? SHOWCASE_PRODUCTS.filter((product) => product.salePaisa)
      : searchProducts(query);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <h1 className="font-display text-2xl tracking-tight sm:text-3xl">
        {query ? `Results for “${query}”` : "Shop all"}
      </h1>
      <p className="mt-1.5 text-xs text-muted-foreground sm:text-sm">
        {products.length} {products.length === 1 ? "product" : "products"}
      </p>
      <form action="/search" className="mt-4 max-w-xl">
        <label className="sr-only" htmlFor="search-q">
          Search products
        </label>
        <input
          id="search-q"
          name="q"
          defaultValue={query === "sale" ? "" : query}
          placeholder="Name or SKU"
          className="h-10 w-full rounded-full border border-input bg-white px-4 text-sm outline-none focus-visible:border-foreground"
        />
      </form>
      <div className="-mx-4 mt-4 sm:-mx-6">
        <CategoryPillsBar>
          {[
            { href: "/search", label: "All", active: !query },
            ...INITIAL_CATEGORIES.map((category) => ({
              href: `/search?q=${category.slug}`,
              label: category.name,
              active: query === category.slug,
            })),
            { href: "/search?q=sale", label: "Sale", active: query.toLowerCase() === "sale" },
          ].map((chip) => (
            <Link key={chip.href} href={chip.href} className={categoryPillClass(chip.active)}>
              {chip.label}
            </Link>
          ))}
        </CategoryPillsBar>
      </div>
      <div className="mt-8">
        <ProductGrid products={products} />
      </div>
    </div>
  );
}
