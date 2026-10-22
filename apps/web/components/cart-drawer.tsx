"use client";

import { formatPaisa, SHOWCASE_PRODUCTS } from "@bismillah/shared";
import { ArrowRight, Minus, Plus, ShoppingBag, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useCart } from "@/hooks/use-cart";
import { addToCart } from "@/lib/cart";
import { useCartUi } from "./cart-provider";

const AUTO_MS = 3800;

export function CartDrawer() {
  const { open, closeCart } = useCartUi();
  const { hydrated, items, count, setQty, remove } = useCart();
  const panelRef = useRef<HTMLDivElement>(null);
  const pauseUntil = useRef(0);

  const subtotal = items.reduce((sum, item) => sum + BigInt(item.linePaisa), 0n);

  const suggestions = useMemo(() => {
    const inCart = new Set(items.map((i) => i.slug));
    return SHOWCASE_PRODUCTS.filter((p) => p.inStock && !inCart.has(p.slug)).slice(0, 8);
  }, [items]);

  const [suggestIndex, setSuggestIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  // Keep index in range when cart changes.
  useEffect(() => {
    setSuggestIndex((i) => (suggestions.length === 0 ? 0 : i % suggestions.length));
  }, [suggestions.length]);

  // Auto-rotate while drawer is open (pauses on hover / after manual click).
  useEffect(() => {
    if (!open || paused || suggestions.length < 2) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const id = window.setInterval(() => {
      if (Date.now() < pauseUntil.current) return;
      setSuggestIndex((i) => (i + 1) % suggestions.length);
    }, AUTO_MS);

    return () => window.clearInterval(id);
  }, [open, paused, suggestions.length]);

  const bumpManual = (dir: -1 | 1) => {
    if (suggestions.length < 2) return;
    pauseUntil.current = Date.now() + AUTO_MS * 2;
    setSuggestIndex((i) => (i + dir + suggestions.length) % suggestions.length);
  };

  const current = suggestions[suggestIndex] ?? suggestions[0];

  return (
    <div
      className={`fixed inset-0 z-[300] ${open ? "pointer-events-auto" : "pointer-events-none"}`}
      aria-hidden={!open}
    >
      <button
        type="button"
        aria-label="Close cart"
        tabIndex={open ? 0 : -1}
        onClick={closeCart}
        className={`absolute inset-0 bg-black/45 backdrop-blur-[2px] transition-opacity duration-300 ${
          open ? "opacity-100" : "opacity-0"
        }`}
      />

      <aside
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Shopping cart"
        className={`absolute inset-y-0 right-0 flex w-full max-w-[26rem] flex-col bg-white shadow-[-24px_0_60px_rgba(0,0,0,0.18)] transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] sm:max-w-[28rem] ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div className="flex items-center gap-2.5">
            <ShoppingBag className="size-4" strokeWidth={1.75} />
            <div>
              <p className="text-[11px] tracking-[0.2em] text-muted-foreground uppercase">
                Shopping cart
              </p>
              <p className="text-sm font-medium">
                {hydrated ? `${count} ${count === 1 ? "item" : "items"}` : "…"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={closeCart}
            className="inline-flex h-10 items-center gap-1.5 text-sm text-muted-foreground transition hover:text-foreground"
          >
            Close
            <ArrowRight className="size-4" />
          </button>
        </div>

        {/* Cart lines only — flex grow so suggestions sit lower */}
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          {!hydrated ? (
            <p className="px-5 py-10 text-sm text-muted-foreground">Loading…</p>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center px-6 py-16 text-center">
              <span className="inline-flex size-14 items-center justify-center border border-border">
                <ShoppingBag className="size-6 text-muted-foreground" strokeWidth={1.5} />
              </span>
              <p className="font-display mt-5 text-2xl tracking-tight">Your bag is empty</p>
              <p className="mt-2 max-w-[16rem] text-sm text-muted-foreground">
                Add a wallet or belt — we pack after a confirmation call.
              </p>
              <button
                type="button"
                onClick={closeCart}
                className="mt-6 inline-flex h-11 items-center bg-foreground px-5 text-sm font-medium text-background"
              >
                Continue shopping
              </button>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {items.map((item) => (
                <li key={`${item.slug}-${item.color}`} className="flex gap-3.5 px-5 py-4">
                  <Link
                    href={`/product/${item.slug}`}
                    onClick={closeCart}
                    className="relative size-[4.75rem] shrink-0 overflow-hidden bg-neutral-100"
                  >
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      sizes="76px"
                      className="object-cover"
                    />
                  </Link>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <Link
                          href={`/product/${item.slug}`}
                          onClick={closeCart}
                          className="line-clamp-2 text-sm font-medium leading-snug hover:underline"
                        >
                          {item.name}
                        </Link>
                        <p className="mt-0.5 text-[11px] tracking-[0.1em] text-muted-foreground uppercase">
                          {item.color}
                        </p>
                      </div>
                      <button
                        type="button"
                        aria-label={`Remove ${item.name}`}
                        onClick={() => remove(item.slug, item.color)}
                        className="inline-flex size-8 shrink-0 items-center justify-center text-muted-foreground transition hover:bg-secondary hover:text-foreground"
                      >
                        <X className="size-4" />
                      </button>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                      <div className="inline-flex h-9 items-stretch border border-input">
                        <button
                          type="button"
                          aria-label="Decrease"
                          className="w-9 transition hover:bg-secondary"
                          onClick={() => setQty(item.slug, item.color, item.qty - 1)}
                        >
                          <Minus className="mx-auto size-3.5" />
                        </button>
                        <span className="flex w-9 items-center justify-center border-x border-input text-xs tabular-nums">
                          {item.qty}
                        </span>
                        <button
                          type="button"
                          aria-label="Increase"
                          className="w-9 transition hover:bg-secondary"
                          onClick={() => setQty(item.slug, item.color, item.qty + 1)}
                        >
                          <Plus className="mx-auto size-3.5" />
                        </button>
                      </div>
                      <p className="text-sm tabular-nums">
                        <span className="text-muted-foreground">
                          {item.qty} × {formatPaisa(BigInt(item.unitPaisa))}
                        </span>
                        <span className="ml-2 font-medium">
                          {formatPaisa(BigInt(item.linePaisa))}
                        </span>
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Suggestions — pinned above total (no empty gap) */}
        {hydrated && items.length > 0 && current ? (
          <div
            className="shrink-0 border-t border-border bg-secondary/50 px-5 py-4"
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
            onFocusCapture={() => setPaused(true)}
            onBlurCapture={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setPaused(false);
            }}
          >
            <div className="mb-2.5 flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] tracking-[0.18em] text-muted-foreground uppercase">
                  You may also like
                </p>
                {suggestions.length > 1 ? (
                  <p className="mt-0.5 text-[10px] tabular-nums text-muted-foreground">
                    {suggestIndex + 1} / {suggestions.length}
                  </p>
                ) : null}
              </div>
              {suggestions.length > 1 ? (
                <div className="flex gap-1">
                  <button
                    type="button"
                    aria-label="Previous suggestion"
                    onClick={() => bumpManual(-1)}
                    className="inline-flex size-8 items-center justify-center border border-border bg-white text-sm transition hover:border-foreground"
                  >
                    ‹
                  </button>
                  <button
                    type="button"
                    aria-label="Next suggestion"
                    onClick={() => bumpManual(1)}
                    className="inline-flex size-8 items-center justify-center border border-border bg-white text-sm transition hover:border-foreground"
                  >
                    ›
                  </button>
                </div>
              ) : null}
            </div>

            <div
              key={current.slug}
              className="cart-suggest-slide flex items-center gap-3 border border-border bg-white p-2.5"
            >
              <Link
                href={`/product/${current.slug}`}
                onClick={closeCart}
                className="relative size-14 shrink-0 overflow-hidden bg-neutral-100"
              >
                <Image
                  src={current.image}
                  alt={current.name}
                  fill
                  sizes="56px"
                  className="object-cover"
                />
              </Link>
              <div className="min-w-0 flex-1">
                <Link
                  href={`/product/${current.slug}`}
                  onClick={closeCart}
                  className="line-clamp-2 text-sm font-medium leading-snug hover:underline"
                >
                  {current.name}
                </Link>
                <p className="mt-0.5 text-xs tabular-nums text-muted-foreground">
                  {formatPaisa(current.salePaisa ?? current.pricePaisa)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  addToCart(current.slug, current.colors[0] ?? "Black", 1);
                }}
                className="inline-flex h-9 shrink-0 items-center border border-foreground px-3 text-xs font-medium tracking-wide uppercase transition hover:bg-foreground hover:text-background"
              >
                + Add
              </button>
            </div>

            {suggestions.length > 1 ? (
              <div className="mt-2.5 flex justify-center gap-1.5" aria-hidden>
                {suggestions.map((p, i) => (
                  <button
                    key={p.slug}
                    type="button"
                    aria-label={`Show suggestion ${i + 1}`}
                    onClick={() => {
                      pauseUntil.current = Date.now() + AUTO_MS * 2;
                      setSuggestIndex(i);
                    }}
                    className={`h-1 rounded-full transition-all ${
                      i === suggestIndex ? "w-4 bg-foreground" : "w-1.5 bg-foreground/25"
                    }`}
                  />
                ))}
              </div>
            ) : null}
          </div>
        ) : null}

        {hydrated && items.length > 0 ? (
          <div className="shrink-0 border-t border-border bg-white px-5 pt-4 pb-[max(1rem,env(safe-area-inset-bottom,0px))]">
            <div className="flex items-baseline justify-between gap-4">
              <span className="text-sm text-muted-foreground">Total</span>
              <span className="text-lg font-medium tabular-nums">{formatPaisa(subtotal)}</span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Shipping calculated at checkout · COD across BD
            </p>
            <div className="mt-4 grid gap-2">
              <Link
                href="/checkout"
                onClick={closeCart}
                className="inline-flex h-12 items-center justify-center bg-foreground text-sm font-medium tracking-[0.08em] text-background uppercase transition hover:opacity-90"
              >
                Checkout
              </Link>
              <Link
                href="/cart"
                onClick={closeCart}
                className="inline-flex h-11 items-center justify-center border border-border text-sm transition hover:border-foreground"
              >
                View full cart
              </Link>
            </div>
          </div>
        ) : null}
      </aside>
    </div>
  );
}
