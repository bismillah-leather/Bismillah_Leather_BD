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
    <section id="all-products" className="bg-white py-14 sm:py-24">
      <div className="mx-auto max-w-7xl px-3 sm:px-6">
        <div className="mb-8 flex flex-col gap-4 sm:mb-10 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs tracking-[0.28em] text-muted-foreground uppercase">Full catalog</p>
            <h2 className="font-display mt-2 text-4xl tracking-tight sm:text-6xl">All products</h2>
            <p className="mt-2 text-sm text-muted-foreground">{products.length} products</p>
          </div>
          <Link href="/search" className="text-sm underline underline-offset-4">
            Open search
          </Link>
        </div>

        <div className="-mx-3 mb-8 flex gap-2 overflow-x-auto px-3 pb-1 sm:mx-0 sm:mb-10 sm:flex-wrap sm:px-0">
          {FILTERS.map((item) => {
            const selected = item.id === filter;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setFilter(item.id)}
                className={`inline-flex h-10 shrink-0 items-center border px-4 text-sm sm:h-11 ${
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
