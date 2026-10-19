"use client";

import { SHOWCASE_PRODUCTS } from "@bismillah/shared";
import Link from "next/link";
import { ProductGrid } from "./product-grid";

const ARRIVALS = SHOWCASE_PRODUCTS.slice(0, 12);

export function NewArrivalsSection() {
  return (
    <section className="bg-white py-14 sm:py-22">
      <div className="mx-auto max-w-7xl px-3 sm:px-6">
        <div className="mb-8 flex flex-col gap-4 sm:mb-12 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs tracking-[0.28em] text-muted-foreground uppercase">Fresh drop</p>
            <h2 className="font-display mt-2 text-4xl tracking-tight sm:text-6xl">New arrivals</h2>
          </div>
          <Link
            href="/search"
            className="text-sm tracking-wide underline underline-offset-4"
          >
            Shop all
          </Link>
        </div>
        <ProductGrid products={ARRIVALS} />
      </div>
    </section>
  );
}
