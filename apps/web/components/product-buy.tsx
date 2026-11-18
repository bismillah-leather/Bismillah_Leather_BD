"use client";

import { formatPaisa, type ProductView } from "@bismillah/shared";
import { Heart, ShoppingBag, Zap } from "lucide-react";
import { useState } from "react";
import { addToCart, buyNow, type CartSnapshot } from "@/lib/cart";
import { PaymentStrip } from "./payment-strip";
import { StockUrgency } from "./stock-urgency";

export function ProductBuy({
  product,
  categoryLabel,
}: {
  product: ProductView;
  categoryLabel: string;
}) {
  const [color, setColor] = useState(product.colors[0] ?? "Black");
  const maxQty = Math.max(1, product.stockQty || 1);
  const [qty, setQty] = useState(1);
  const [saved, setSaved] = useState(false);
  const [added, setAdded] = useState(false);
  const [busy, setBusy] = useState(false);
  const price = BigInt(product.pricePaisa);
  const compare = product.comparePaisa ? BigInt(product.comparePaisa) : null;

  const cartOpts = {
    inStock: product.inStock,
    snapshot: {
      name: product.name,
      image: product.image,
      sku: product.sku,
      unitPaisa: product.pricePaisa,
      comparePaisa: product.comparePaisa,
    } satisfies CartSnapshot,
  };

  const handleBuyNow = () => {
    if (!product.inStock || busy) return;
    setBusy(true);
    const ok = buyNow(product.slug, color, qty, cartOpts);
    if (!ok) setBusy(false);
  };

  const handleAdd = () => {
    if (!product.inStock) return;
    if (!addToCart(product.slug, color, qty, cartOpts)) return;
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1400);
  };

  return (
    <div className="lg:sticky lg:top-[calc(var(--site-header-offset,7rem)+0.75rem)]">
      <p className="text-[11px] tracking-[0.28em] text-neutral-500 uppercase">
        {product.kind} · {categoryLabel}
      </p>
      <h1 className="font-display mt-3 text-[2.35rem] leading-[0.98] tracking-[-0.035em] text-neutral-950 sm:text-5xl lg:text-[3.15rem]">
        {product.name}
      </h1>
      {product.blurb ? (
        <p className="mt-4 max-w-md text-[15px] leading-7 text-neutral-600">{product.blurb}</p>
      ) : null}

      <div className="mt-6 flex flex-wrap items-end justify-between gap-3 border-b border-neutral-200 pb-5">
        <p className="text-[1.65rem] tracking-tight text-neutral-950">
          <span className="font-medium">{formatPaisa(price)}</span>
          {compare ? (
            <span className="ml-3 text-base text-neutral-400 line-through">{formatPaisa(compare)}</span>
          ) : null}
        </p>
        <p className="text-[11px] tracking-[0.16em] text-neutral-400 uppercase">{product.sku}</p>
      </div>

      <div className="mt-6">
        <p className="text-[11px] tracking-[0.2em] text-neutral-500 uppercase">Colour · {color}</p>
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
                    ? "border-neutral-950 bg-neutral-950 text-white"
                    : "border-neutral-300 bg-white text-neutral-800 hover:border-neutral-950"
                }`}
              >
                {option}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <div className="inline-flex h-12 items-stretch border border-neutral-300 bg-white">
          <button
            type="button"
            className="w-11 text-lg transition hover:bg-neutral-100"
            aria-label="Decrease quantity"
            onClick={() => setQty((value) => Math.max(1, value - 1))}
          >
            −
          </button>
          <span className="flex w-12 items-center justify-center border-x border-neutral-300 text-sm tabular-nums">
            {qty}
          </span>
          <button
            type="button"
            className="w-11 text-lg transition hover:bg-neutral-100"
            aria-label="Increase quantity"
            onClick={() => setQty((value) => Math.min(maxQty, value + 1))}
          >
            +
          </button>
        </div>
        <button
          type="button"
          onClick={() => setSaved((value) => !value)}
          className="inline-flex h-12 items-center gap-2 border border-neutral-300 bg-white px-4 text-sm transition hover:border-neutral-950"
          aria-pressed={saved}
        >
          <Heart className={`size-4 ${saved ? "fill-neutral-950 text-neutral-950" : ""}`} />
          Wishlist
        </button>
      </div>

      <div className="mt-5 hidden gap-3 sm:grid sm:grid-cols-2">
        <button
          type="button"
          disabled={!product.inStock || busy}
          onClick={handleBuyNow}
          className={`inline-flex h-12 items-center justify-center gap-2 text-sm font-medium tracking-[0.14em] uppercase transition ${
            product.inStock
              ? "bg-neutral-950 text-white hover:bg-black disabled:opacity-60"
              : "pointer-events-none bg-neutral-100 text-neutral-400"
          }`}
        >
          <Zap className="size-4" strokeWidth={1.75} />
          Buy now
        </button>
        <button
          type="button"
          disabled={!product.inStock}
          onClick={handleAdd}
          className={`inline-flex h-12 items-center justify-center gap-2 border text-sm font-medium tracking-[0.14em] uppercase transition ${
            product.inStock
              ? added
                ? "border-neutral-950 bg-neutral-950 text-white"
                : "border-neutral-950 bg-white text-neutral-950 hover:bg-neutral-950 hover:text-white"
              : "pointer-events-none border-neutral-200 bg-neutral-100 text-neutral-400"
          }`}
        >
          <ShoppingBag className="size-4" strokeWidth={1.75} />
          {added ? "Added" : "Add to cart"}
        </button>
      </div>

      <StockUrgency slug={product.slug} stockQty={product.stockQty} inStock={product.inStock} />

      <div className="mt-8">
        <PaymentStrip />
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-2 gap-2 border-t border-border bg-white/95 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom,0px))] backdrop-blur-md sm:hidden">
        <button
          type="button"
          disabled={!product.inStock}
          onClick={handleAdd}
          className={`inline-flex h-12 items-center justify-center border text-sm font-medium ${
            product.inStock
              ? "border-neutral-950"
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
              ? "bg-neutral-950 text-white disabled:opacity-60"
              : "pointer-events-none bg-secondary text-muted-foreground"
          }`}
        >
          Buy now
        </button>
      </div>
    </div>
  );
}
