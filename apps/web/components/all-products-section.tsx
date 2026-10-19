"use client";

import { SHOWCASE_PRODUCTS, type ShowcaseProduct } from "@bismillah/shared";
import Link from "next/link";
import { useMemo, useState } from "react";
import { ProductGrid } from "./product-grid";

const FILTERS = [
  { id: "all", label: "All" },
  { id: "wallet", label: "Wallets" },
  { id: "belt", label: "Belts" },
  { id: "sale", label: "Sale" },
] as const;

type FilterId = (typeof FILTERS)[number]["id"];

function matchesFilter(product: ShowcaseProduct, filter: FilterId) {
  if (filter === "all") return true;
  if (filter === "sale") return Boolean(product.salePaisa);
  return product.kind === filter;
}

export function AllProductsSection() {
  const [filter, setFilter] = useState<FilterId>("all");
  const products = useMemo(
    () => SHOWCASE_PRODUCTS.filter((product) => matchesFilter(product, filter)),
    [filter],
  );

  return (
    <section id="all-products" className="border-y border-border bg-white py-14 sm:py-24">
      <div className="mx-auto max-w-7xl px-3 sm:px-6">
        <div className="mb-8 flex flex-col gap-5 sm:mb-12 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <p className="text-xs tracking-[0.28em] text-muted-foreground uppercase">Full catalog</p>
            <h2 className="font-display mt-2 text-4xl tracking-tight sm:text-6xl md:text-7xl">
              All products
            </h2>
            <p className="mt-3 max-w-md text-sm leading-6 text-muted-foreground">
              Every wallet and belt in the Mirpur line — filter by type or jump straight into search.
            </p>
          </div>
          <div className="flex flex-col items-start gap-2 sm:items-end">
            <p className="text-sm tabular-nums text-muted-foreground">
              <span className="font-medium text-foreground">{products.length}</span> products
            </p>
            <Link
              href="/search"
              className="inline-flex h-11 items-center border border-foreground px-4 text-sm transition hover:bg-foreground hover:text-background"
            >
              Open search
            </Link>
          </div>
        </div>

        <div className="-mx-3 mb-8 flex gap-2 overflow-x-auto px-3 pb-1 sm:mx-0 sm:mb-10 sm:flex-wrap sm:px-0">
          {FILTERS.map((item) => {
            const selected = item.id === filter;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setFilter(item.id)}
                className={`inline-flex h-10 shrink-0 items-center border px-4 text-sm tracking-wide sm:h-11 ${
                  selected
                    ? "border-foreground bg-foreground text-background"
                    : "border-input bg-white hover:border-foreground"
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>

        <ProductGrid products={products} />
      </div>
    </section>
  );
}
