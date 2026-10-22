"use client";

import { type ShowcaseProduct } from "@bismillah/shared";
import Link from "next/link";
import { useMemo } from "react";
import { useCatalogFilter, type CatalogFilterId } from "./catalog-filter";
import { ProductGrid } from "./product-grid";

function matchesFilter(product: ShowcaseProduct, filter: CatalogFilterId) {
  if (filter === "all") return true;
  if (filter === "sale") return Boolean(product.salePaisa);
  return product.categorySlug === filter;
}

export function AllProductsSection({ products: catalog }: { products: ShowcaseProduct[] }) {
  const { filter } = useCatalogFilter();
  const products = useMemo(
    () => catalog.filter((product) => matchesFilter(product, filter)),
    [catalog, filter],
  );

  return (
    <section
      id="all-products"
      className="scroll-mt-[calc(var(--site-header-offset,7rem)+3.25rem)] border-b border-border bg-white"
    >
      <div className="mx-auto max-w-7xl px-3 py-6 sm:px-6 sm:py-8">
        <div className="mb-5 flex items-end justify-between gap-3">
          <div>
            <h2 className="font-display text-xl tracking-tight sm:text-2xl">All products</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              <span className="font-medium text-foreground">{products.length}</span> products
            </p>
          </div>
          <Link
            href="/search"
            className="inline-flex h-8 shrink-0 items-center rounded-full border border-foreground px-3.5 text-[11px] tracking-wide uppercase transition hover:bg-foreground hover:text-background"
          >
            Search
          </Link>
        </div>

        <ProductGrid products={products} />
      </div>
    </section>
  );
}
