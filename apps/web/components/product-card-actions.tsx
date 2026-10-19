"use client";

import { ShoppingBag } from "lucide-react";
import Link from "next/link";

export function ProductCardActions({
  slug,
  color,
  inStock = true,
  compact = false,
  tone = "light",
  flush = false,
}: {
  slug: string;
  color: string;
  inStock?: boolean;
  compact?: boolean;
  tone?: "light" | "dark";
  flush?: boolean;
}) {
  const checkoutHref = `/checkout?product=${encodeURIComponent(slug)}&color=${encodeURIComponent(color)}`;
  const dark = tone === "dark";

  if (!inStock) {
    return (
      <p className={`${flush ? "" : "mt-3"} text-xs text-muted-foreground uppercase`}>Sold out</p>
    );
  }

  return (
    <div className={`${flush ? "" : "mt-3"} flex items-stretch gap-2`}>
      <Link
        href={checkoutHref}
        className={`inline-flex flex-1 items-center justify-center font-medium transition hover:opacity-90 ${
          compact ? "h-9 text-xs sm:h-10" : "h-10 text-sm sm:h-11"
        } ${dark ? "bg-white text-black" : "bg-foreground text-background"}`}
      >
        Buy now
      </Link>
      <Link
        href={checkoutHref}
        aria-label="Add to cart"
        className={`inline-flex shrink-0 items-center justify-center border transition ${
          compact ? "size-9 sm:size-10" : "size-10 sm:size-11"
        } ${
          dark
            ? "border-white/50 text-white hover:bg-white hover:text-black"
            : "border-foreground bg-white text-foreground hover:bg-foreground hover:text-background"
        }`}
      >
        <ShoppingBag className="size-4" strokeWidth={1.75} />
      </Link>
    </div>
  );
}
