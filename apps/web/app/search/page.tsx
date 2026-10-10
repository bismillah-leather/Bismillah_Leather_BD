import { SHOWCASE_PRODUCTS, searchProducts } from "@bismillah/shared";
import type { Metadata } from "next";
import Link from "next/link";
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
  const products =
    query.toLowerCase() === "sale"
      ? SHOWCASE_PRODUCTS.filter((product) => product.salePaisa)
      : searchProducts(query);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <h1 className="font-display text-4xl sm:text-5xl">
        {query ? `Results for “${query}”` : "Shop all"}
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {products.length} {products.length === 1 ? "product" : "products"}
      </p>
      <form action="/search" className="mt-5 max-w-xl">
        <label className="sr-only" htmlFor="search-q">
          Search products
        </label>
        <input
          id="search-q"
          name="q"
          defaultValue={query === "sale" ? "" : query}
          placeholder="Name or SKU"
          className="h-12 w-full rounded-full border border-input bg-white px-4 text-base outline-none focus-visible:border-foreground"
        />
      </form>
      <div className="mt-5 flex gap-2 overflow-x-auto pb-1">
        {[
          { href: "/search", label: "All" },
          { href: "/search?q=wallet", label: "Wallets" },
          { href: "/search?q=belt", label: "Belts" },
          { href: "/search?q=sale", label: "Sale" },
        ].map((chip) => (
          <Link
            key={chip.href}
            href={chip.href}
            className="inline-flex h-10 shrink-0 items-center border border-input bg-white px-4 text-sm"
          >
            {chip.label}
          </Link>
        ))}
      </div>
      <div className="mt-8">
        <ProductGrid products={products} />
      </div>
    </div>
  );
}
