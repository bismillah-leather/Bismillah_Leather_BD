import { searchProducts } from "@bismillah/shared";
import type { Metadata } from "next";
import { Suspense } from "react";
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
  const products = searchProducts(query);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <h1 className="font-display text-4xl">{query ? `Results for “${query}”` : "Shop all"}</h1>
      <form action="/search" className="mt-5 max-w-xl">
        <label className="sr-only" htmlFor="search-q">
          Search products
        </label>
        <input
          id="search-q"
          name="q"
          defaultValue={query}
          placeholder="Name or SKU"
          className="h-12 w-full rounded-full border border-input bg-white px-4 text-base outline-none focus-visible:border-foreground"
        />
      </form>
      <div className="mt-8">
        <ProductGrid products={products} />
      </div>
    </div>
  );
}
