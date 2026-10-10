"use client";

import { formatPaisa, type ProductView } from "@bismillah/shared";
import Link from "next/link";
import { useState } from "react";

export function ProductBuy({ product }: { product: ProductView }) {
  const [color, setColor] = useState(product.colors[0] ?? "Black");
  const price = BigInt(product.pricePaisa);
  const compare = product.comparePaisa ? BigInt(product.comparePaisa) : null;
  const query = `product=${product.slug}&color=${encodeURIComponent(color)}`;

  return (
    <div>
      <p className="text-sm text-muted-foreground">{product.sku}</p>
      <h1 className="font-display mt-2 text-4xl leading-[0.95] sm:text-6xl">{product.name}</h1>
      <p className="mt-4 text-xl">
        <span className="font-medium">{formatPaisa(price)}</span>
        {compare ? (
          <span className="ml-2 text-sm text-muted-foreground line-through">
            {formatPaisa(compare)}
          </span>
        ) : null}
      </p>
      <p className="mt-4 max-w-md text-sm leading-6 text-muted-foreground">{product.blurb}</p>

      <p className="mt-6 text-xs tracking-[0.16em] uppercase">Color · {color}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {product.colors.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => setColor(option)}
            className={`h-11 rounded-full border px-4 text-sm ${
              option === color ? "border-foreground bg-foreground text-background" : "border-input bg-white"
            }`}
          >
            {option}
          </button>
        ))}
      </div>

      <p className="mt-4 text-sm">{product.inStock ? "In stock" : "Sold out"}</p>
      <ul className="mt-4 grid gap-1 text-sm text-muted-foreground">
        <li>Cash on delivery</li>
        <li>Inside Dhaka ৳80 · outside ৳130</li>
        <li>We call to confirm before dispatch</li>
      </ul>

      <div className="mt-6 hidden gap-3 sm:grid">
        <Link
          href={product.inStock ? `/checkout?${query}` : "#"}
          aria-disabled={!product.inStock}
          className={`inline-flex h-12 items-center justify-center rounded-md text-sm font-medium ${
            product.inStock ? "bg-foreground text-background" : "pointer-events-none bg-secondary text-muted-foreground"
          }`}
        >
          Buy it now
        </Link>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background p-3 sm:hidden">
        <Link
          href={product.inStock ? `/checkout?${query}` : "#"}
          aria-disabled={!product.inStock}
          className={`inline-flex h-12 w-full items-center justify-center rounded-md text-sm font-medium ${
            product.inStock ? "bg-foreground text-background" : "pointer-events-none bg-secondary text-muted-foreground"
          }`}
        >
          {product.inStock ? `Buy now · ${formatPaisa(price)}` : "Sold out"}
        </Link>
      </div>
    </div>
  );
}
