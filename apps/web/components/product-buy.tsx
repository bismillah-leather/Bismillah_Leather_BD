"use client";

import { BRAND, formatPaisa, type ProductView } from "@bismillah/shared";
import { Heart, Phone, ShoppingBag, Zap } from "lucide-react";
import { useState } from "react";
import { addToCart, buyNow } from "@/lib/cart";
import { PaymentStrip } from "./payment-strip";

export function ProductBuy({ product }: { product: ProductView }) {
  const [color, setColor] = useState(product.colors[0] ?? "Black");
  const [qty, setQty] = useState(1);
  const [saved, setSaved] = useState(false);
  const [added, setAdded] = useState(false);
  const [busy, setBusy] = useState(false);
  const price = BigInt(product.pricePaisa);
  const compare = product.comparePaisa ? BigInt(product.comparePaisa) : null;
  const whatsappHref = `${BRAND.whatsappUrl}?text=${encodeURIComponent(
    `আসসালামু আলাইকুম, ${product.name} (${product.sku}) · ${color} × ${qty} নিতে চাই।`,
  )}`;
  const tags = [
    product.kind,
    product.categorySlug.replaceAll("-", " "),
    ...product.colors.slice(0, 2),
  ];

  const handleBuyNow = () => {
    if (!product.inStock || busy) return;
    setBusy(true);
    const ok = buyNow(product.slug, color, qty);
    if (!ok) setBusy(false);
  };

  const handleAdd = () => {
    if (!product.inStock) return;
    if (!addToCart(product.slug, color, qty)) return;
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1400);
  };

  return (
    <div className="lg:sticky lg:top-[calc(var(--site-header-offset,7rem)+0.75rem)]">
      <div className="flex flex-wrap items-center gap-2">
        {compare ? (
          <span className="inline-flex bg-foreground px-2 py-1 text-[10px] tracking-[0.14em] text-background uppercase">
            Sale
          </span>
        ) : null}
        <span className="inline-flex border border-border px-2 py-1 text-[10px] tracking-[0.14em] text-muted-foreground uppercase">
          {product.inStock ? "In stock" : "Sold out"}
        </span>
        <span className="text-xs tracking-[0.12em] text-muted-foreground uppercase">
          {product.sku}
        </span>
      </div>

      <h1 className="font-display mt-4 text-4xl leading-[0.98] tracking-tight sm:text-5xl lg:text-[3.35rem]">
        {product.name}
      </h1>

      <p className="mt-4 text-2xl tracking-tight">
        <span className="font-medium">{formatPaisa(price)}</span>
        {compare ? (
          <span className="ml-3 text-base text-muted-foreground line-through">
            {formatPaisa(compare)}
          </span>
        ) : null}
      </p>
      <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">{product.blurb}</p>

      <div className="mt-7">
        <p className="text-xs tracking-[0.16em] text-muted-foreground uppercase">
          Color · {color}
        </p>
        <div className="mt-2.5 flex flex-wrap gap-2">
          {product.colors.map((option) => {
            const selected = option === color;
            return (
              <button
                key={option}
                type="button"
                onClick={() => setColor(option)}
                className={`inline-flex h-11 items-center border px-4 text-sm transition ${
                  selected
                    ? "border-foreground bg-foreground text-background"
                    : "border-input bg-white hover:border-foreground"
                }`}
              >
                {option}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <div className="inline-flex h-12 items-stretch border border-input bg-white">
          <button
            type="button"
            className="w-11 text-lg transition hover:bg-secondary"
            aria-label="Decrease quantity"
            onClick={() => setQty((value) => Math.max(1, value - 1))}
          >
            −
          </button>
          <span className="flex w-12 items-center justify-center border-x border-input text-sm tabular-nums">
            {qty}
          </span>
          <button
            type="button"
            className="w-11 text-lg transition hover:bg-secondary"
            aria-label="Increase quantity"
            onClick={() => setQty((value) => Math.min(5, value + 1))}
          >
            +
          </button>
        </div>
        <button
          type="button"
          onClick={() => setSaved((value) => !value)}
          className="inline-flex h-12 items-center gap-2 border border-input bg-white px-4 text-sm transition hover:border-foreground"
          aria-pressed={saved}
        >
          <Heart className={`size-4 ${saved ? "fill-foreground text-foreground" : ""}`} />
          Wishlist
        </button>
      </div>

      <div className="mt-5 hidden gap-3 sm:grid sm:grid-cols-2">
        <button
          type="button"
          disabled={!product.inStock || busy}
          onClick={handleBuyNow}
          className={`inline-flex h-12 items-center justify-center gap-2 text-sm font-medium tracking-wide uppercase transition ${
            product.inStock
              ? "bg-foreground text-background hover:opacity-90 disabled:opacity-60"
              : "pointer-events-none bg-secondary text-muted-foreground"
          }`}
        >
          <Zap className="size-4" strokeWidth={1.75} />
          Buy now
        </button>
        <button
          type="button"
          disabled={!product.inStock}
          onClick={handleAdd}
          className={`inline-flex h-12 items-center justify-center gap-2 border text-sm font-medium tracking-wide uppercase transition ${
            product.inStock
              ? added
                ? "border-foreground bg-foreground text-background"
                : "border-foreground bg-white text-foreground hover:bg-foreground hover:text-background"
              : "pointer-events-none border-border bg-secondary text-muted-foreground"
          }`}
        >
          <ShoppingBag className="size-4" strokeWidth={1.75} />
          {added ? "Added" : "Add to cart"}
        </button>
        <a
          href={whatsappHref}
          target="_blank"
          rel="noreferrer"
          className="inline-flex min-h-12 items-center justify-center gap-2 border border-[#128C7E]/35 bg-[#128C7E] text-sm font-medium tracking-wide text-white uppercase transition hover:bg-[#0e7a6e]"
        >
          Order on WhatsApp
        </a>
        <a
          href={`tel:${BRAND.phoneE164}`}
          className="inline-flex min-h-12 items-center justify-center gap-2 border border-foreground/80 bg-neutral-900 text-sm font-medium tracking-wide text-white uppercase transition hover:bg-black"
        >
          <Phone className="size-4" strokeWidth={1.75} />
          Call to order
        </a>
      </div>

      <div className="mt-6">
        <p className="text-xs tracking-[0.16em] text-muted-foreground uppercase">Tags</p>
        <ul className="mt-2.5 flex flex-wrap gap-2">
          {tags.map((tag) => (
            <li
              key={tag}
              className="inline-flex h-8 items-center border border-border bg-secondary/60 px-3 text-xs tracking-wide text-muted-foreground lowercase"
            >
              #{tag.replaceAll(" ", "")}
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-7">
        <PaymentStrip />
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-2 gap-2 border-t border-border bg-white/95 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom,0px))] backdrop-blur-md sm:hidden">
        <button
          type="button"
          disabled={!product.inStock}
          onClick={handleAdd}
          className={`inline-flex h-12 items-center justify-center border text-sm font-medium ${
            product.inStock
              ? "border-foreground"
              : "pointer-events-none border-border text-muted-foreground"
          }`}
        >
          {added ? "Added" : "Add to cart"}
        </button>
        <button
          type="button"
          disabled={!product.inStock || busy}
          onClick={handleBuyNow}
          className={`inline-flex h-12 items-center justify-center text-sm font-medium ${
            product.inStock
              ? "bg-foreground text-background disabled:opacity-60"
              : "pointer-events-none bg-secondary text-muted-foreground"
          }`}
        >
          Buy now
        </button>
      </div>
    </div>
  );
}
