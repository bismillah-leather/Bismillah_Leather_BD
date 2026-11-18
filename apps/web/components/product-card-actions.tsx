"use client";

import { ShoppingBag } from "lucide-react";
import { useState } from "react";
import { addToCart, buyNow, snapshotFromOffer, type CartOffer } from "@/lib/cart";

export function ProductCardActions({
  product,
  slug,
  color,
  inStock = true,
  compact = false,
  tone = "light",
  flush = false,
}: {
  product?: CartOffer;
  slug?: string;
  color: string;
  inStock?: boolean;
  compact?: boolean;
  tone?: "light" | "dark";
  flush?: boolean;
}) {
  const [added, setAdded] = useState(false);
  const [busy, setBusy] = useState(false);
  const dark = tone === "dark";
  const liveSlug = product?.slug || slug || "";
  const stocked = product?.inStock ?? inStock;
  const opts = product
    ? { inStock: stocked, snapshot: snapshotFromOffer(product), offer: product }
    : { inStock: stocked };

  if (!stocked) {
    return (
      <p className={`${flush ? "" : "mt-3"} text-xs text-muted-foreground uppercase`}>Sold out</p>
    );
  }

  return (
    <div className={`${flush ? "" : "mt-3"} flex items-stretch gap-2`}>
      <button
        type="button"
        disabled={busy || !liveSlug}
        onClick={() => {
          setBusy(true);
          const ok = buyNow(liveSlug, color, 1, opts);
          if (!ok) setBusy(false);
        }}
        className={`inline-flex flex-1 items-center justify-center font-medium transition hover:opacity-90 disabled:opacity-60 ${
          compact ? "h-9 text-xs sm:h-10" : "h-10 text-sm sm:h-11"
        } ${dark ? "bg-white text-black" : "bg-foreground text-background"}`}
      >
        Buy now
      </button>
      <button
        type="button"
        aria-label="Add to cart"
        onClick={() => {
          if (!addToCart(liveSlug, color, 1, opts)) return;
          setAdded(true);
          window.setTimeout(() => setAdded(false), 1200);
        }}
        className={`inline-flex shrink-0 items-center justify-center border transition ${
          compact ? "size-9 sm:size-10" : "size-10 sm:size-11"
        } ${
          added
            ? dark
              ? "border-white bg-white text-black"
              : "border-foreground bg-foreground text-background"
            : dark
              ? "border-white/50 text-white hover:bg-white hover:text-black"
              : "border-foreground bg-white text-foreground hover:bg-foreground hover:text-background"
        }`}
      >
        <ShoppingBag className="size-4" strokeWidth={1.75} />
      </button>
    </div>
  );
}
