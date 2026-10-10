"use client";

import { BRAND, formatPaisa, type ProductView } from "@bismillah/shared";
import { ChevronDown, Heart } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { PaymentStrip } from "./payment-strip";

export function ProductBuy({ product }: { product: ProductView }) {
  const [color, setColor] = useState(product.colors[0] ?? "Black");
  const [qty, setQty] = useState(1);
  const [openDesc, setOpenDesc] = useState(true);
  const [saved, setSaved] = useState(false);
  const price = BigInt(product.pricePaisa);
  const compare = product.comparePaisa ? BigInt(product.comparePaisa) : null;
  const query = `product=${product.slug}&color=${encodeURIComponent(color)}&qty=${qty}`;

  return (
    <div>
      <p className="text-sm text-muted-foreground">{product.sku}</p>
      <h1 className="font-display mt-2 text-4xl leading-[0.95] sm:text-5xl lg:text-6xl">
        {product.name}
      </h1>
      <p className="mt-4 text-xl">
        <span className="font-medium">{formatPaisa(price)}</span>
        {compare ? (
          <span className="ml-2 text-sm text-muted-foreground line-through">
            {formatPaisa(compare)}
          </span>
        ) : null}
      </p>

      <p className="mt-6 text-xs tracking-[0.16em] uppercase">Color · {color}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {product.colors.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => setColor(option)}
            className={`h-11 border px-4 text-sm ${
              option === color ? "border-foreground bg-foreground text-background" : "border-input bg-white"
            }`}
          >
            {option}
          </button>
        ))}
      </div>

      <p className="mt-5 text-sm">
        {product.inStock ? "In stock · we pack after a confirmation call" : "Sold out"}
      </p>

      <div className="mt-5 flex items-center gap-3">
        <div className="inline-flex h-12 items-center border border-input bg-white">
          <button
            type="button"
            className="size-12 text-lg"
            aria-label="Decrease quantity"
            onClick={() => setQty((value) => Math.max(1, value - 1))}
          >
            −
          </button>
          <span className="w-10 text-center text-sm">{qty}</span>
          <button
            type="button"
            className="size-12 text-lg"
            aria-label="Increase quantity"
            onClick={() => setQty((value) => Math.min(5, value + 1))}
          >
            +
          </button>
        </div>
        <button
          type="button"
          onClick={() => setSaved((value) => !value)}
          className="inline-flex h-12 items-center gap-2 border border-input bg-white px-4 text-sm"
          aria-pressed={saved}
        >
          <Heart className={`size-4 ${saved ? "fill-accent text-accent" : ""}`} />
          Wishlist
        </button>
      </div>

      <div className="mt-4 hidden gap-3 sm:grid">
        <Link
          href={product.inStock ? `/checkout?${query}` : "#"}
          aria-disabled={!product.inStock}
          className={`inline-flex h-12 items-center justify-center text-sm font-medium tracking-wide uppercase ${
            product.inStock
              ? "border border-foreground bg-white text-foreground"
              : "pointer-events-none bg-secondary text-muted-foreground"
          }`}
        >
          Add to cart
        </Link>
        <Link
          href={product.inStock ? `/checkout?${query}` : "#"}
          aria-disabled={!product.inStock}
          className={`inline-flex h-12 items-center justify-center text-sm font-medium tracking-wide uppercase ${
            product.inStock
              ? "bg-foreground text-background"
              : "pointer-events-none bg-secondary text-muted-foreground"
          }`}
        >
          Buy it now
        </Link>
      </div>

      <div className="mt-6">
        <PaymentStrip />
      </div>
      <a
        href={`${BRAND.whatsappUrl}?text=${encodeURIComponent(`আসসালামু আলাইকুম, ${product.name} (${product.sku}) · ${color} নিতে চাই।`)}`}
        target="_blank"
        rel="noreferrer"
        className="mt-4 inline-flex h-11 w-full items-center justify-center border border-input bg-white text-sm"
      >
        WhatsApp · {BRAND.phoneDisplay}
      </a>

      <div className="mt-6 border-t border-border">
        <button
          type="button"
          className="flex w-full items-center justify-between py-4 text-left text-sm font-medium"
          onClick={() => setOpenDesc((value) => !value)}
          aria-expanded={openDesc}
        >
          Description
          <ChevronDown className={`size-4 transition ${openDesc ? "rotate-180" : ""}`} />
        </button>
        {openDesc ? (
          <div className="pb-4 text-sm leading-7 text-muted-foreground">
            <p>{product.blurb}</p>
            <ul className="mt-3 grid gap-1">
              <li>Full-grain leather feel, cut for daily carry</li>
              <li>Color options ready for Facebook and TikTok share links</li>
              <li>Cash on delivery across Bangladesh</li>
            </ul>
          </div>
        ) : null}
      </div>

      <div className="border-t border-border">
        <details className="group py-4">
          <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-medium">
            Shipping
            <ChevronDown className="size-4 transition group-open:rotate-180" />
          </summary>
          <p className="mt-3 text-sm leading-7 text-muted-foreground">
            Inside Dhaka ৳80. Outside Dhaka ৳130. We call before Pathao / Steadfast / RedX booking.
          </p>
        </details>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-2 gap-2 border-t border-border bg-background/95 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom,0px))] backdrop-blur-md sm:hidden">
        <Link
          href={product.inStock ? `/checkout?${query}` : "#"}
          className={`inline-flex h-12 items-center justify-center border text-sm font-medium ${
            product.inStock
              ? "border-foreground"
              : "pointer-events-none border-border text-muted-foreground"
          }`}
        >
          Add to cart
        </Link>
        <Link
          href={product.inStock ? `/checkout?${query}` : "#"}
          className={`inline-flex h-12 items-center justify-center text-sm font-medium ${
            product.inStock
              ? "bg-foreground text-background"
              : "pointer-events-none bg-secondary text-muted-foreground"
          }`}
        >
          Buy now
        </Link>
      </div>
    </div>
  );
}
