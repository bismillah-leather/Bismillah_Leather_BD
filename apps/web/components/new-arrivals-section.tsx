"use client";

import { SHOWCASE_PRODUCTS } from "@bismillah/shared";
import Link from "next/link";
import { ProductGrid } from "./product-grid";

const ARRIVALS = SHOWCASE_PRODUCTS.slice(0, 12);

export function NewArrivalsSection() {
  return (
    <section className="bg-white py-10 sm:py-14">
      <div className="mx-auto max-w-7xl px-3 sm:px-6">
        <div className="mb-6 flex flex-col gap-3 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[10px] tracking-[0.28em] text-muted-foreground uppercase sm:text-[11px]">
              Fresh drop
            </p>
            <h2 className="font-display mt-1.5 text-2xl tracking-tight sm:text-3xl md:text-4xl">
              New arrivals
            </h2>
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
