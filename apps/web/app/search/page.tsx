import type { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Search",
  robots: { index: false, follow: true },
};

export default function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string | string[] }>;
}) {
  return (
    <Suspense fallback={<div className="mx-auto max-w-6xl px-4 py-10 text-muted-foreground">Loading search…</div>}>
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

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-4xl">Search</h1>
      <form action="/search" className="mt-6 max-w-xl">
        <label className="sr-only" htmlFor="search-q">
          Search products
        </label>
        <input
          id="search-q"
          name="q"
          defaultValue={query}
          placeholder="Name or SKU"
          className="h-12 w-full rounded-md border border-input bg-card px-3 text-base outline-none focus-visible:border-ring"
        />
      </form>
      <p className="mt-8 text-muted-foreground">
        {query
          ? `No published products match “${query}” yet.`
          : "Search by name or SKU once products are published."}
      </p>
    </div>
  );
}
