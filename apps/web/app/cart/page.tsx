"use client";

import { formatPaisa, SHOWCASE_PRODUCTS } from "@bismillah/shared";
import { ArrowLeft, Minus, Plus, ShoppingBag, Trash2, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useMemo } from "react";
import { useCart } from "@/hooks/use-cart";
import { addToCart } from "@/lib/cart";
import { openCartDrawer } from "@/components/cart-provider";
import { NewBadge } from "@/components/new-badge";

export default function CartPage() {
  const { hydrated, items, count, setQty, remove } = useCart();
  const subtotal = items.reduce((sum, item) => sum + BigInt(item.linePaisa), 0n);

  const suggestions = useMemo(() => {
    const inCart = new Set(items.map((i) => i.slug));
    return SHOWCASE_PRODUCTS.filter((p) => p.inStock && !inCart.has(p.slug)).slice(0, 4);
  }, [items]);

  return (
    <div className="relative min-h-[70vh] bg-secondary/30">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 20%, #000 0.55px, transparent 0.65px), radial-gradient(circle at 80% 70%, #000 0.5px, transparent 0.6px)",
          backgroundSize: "26px 26px, 38px 38px",
        }}
      />

      <div className="relative border-b border-border bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-end justify-between gap-4 px-4 py-8 sm:px-6 sm:py-10">
          <div>
            <p className="text-[11px] tracking-[0.22em] text-muted-foreground uppercase">Bag</p>
            <h1 className="font-display mt-1 text-4xl tracking-tight sm:text-5xl">Your cart</h1>
            {hydrated ? (
              <p className="mt-2 text-sm text-muted-foreground">
                {count} {count === 1 ? "item" : "items"} · shipping at checkout
              </p>
            ) : null}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={openCartDrawer}
              className="inline-flex h-11 items-center gap-2 border border-border px-4 text-sm transition hover:border-foreground"
            >
              <ShoppingBag className="size-4" />
              Quick cart
            </button>
            <Link
              href="/#all-products"
              className="inline-flex h-11 items-center gap-2 text-sm underline underline-offset-4"
            >
              <ArrowLeft className="size-3.5" />
              Continue shopping
            </Link>
          </div>
        </div>
      </div>

      <div className="relative mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
        {!hydrated ? (
          <p className="text-sm text-muted-foreground">Loading cart…</p>
        ) : items.length === 0 ? (
          <div className="border border-border bg-white px-6 py-20 text-center">
            <span className="mx-auto inline-flex size-14 items-center justify-center border border-border">
              <ShoppingBag className="size-6 text-muted-foreground" strokeWidth={1.5} />
            </span>
            <p className="font-display mt-6 text-3xl tracking-tight">Your cart is empty</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Add a wallet or belt, then checkout with cash on delivery.
            </p>
            <Link
              href="/#all-products"
              className="mt-8 inline-flex h-12 items-center bg-foreground px-6 text-sm font-medium text-background"
            >
              Browse products
            </Link>
          </div>
        ) : (
          <div className="grid gap-8 lg:grid-cols-[1fr_22rem] lg:items-start xl:gap-12">
            <ul className="grid gap-3">
              {items.map((item) => (
                <li
                  key={`${item.slug}-${item.color}`}
                  className="grid gap-4 border border-border bg-white p-4 sm:grid-cols-[7rem_1fr] sm:p-5"
                >
                  <Link
                    href={`/product/${item.slug}`}
                    className="relative aspect-square overflow-hidden bg-neutral-100"
                  >
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      sizes="112px"
                      className="object-cover transition duration-500 hover:scale-105"
                    />
                  </Link>
                  <div className="min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <Link href={`/product/${item.slug}`}>
                          <h2 className="font-display text-2xl tracking-tight hover:underline">
                            {item.name}
                          </h2>
                        </Link>
                        <p className="mt-1 text-xs tracking-[0.12em] text-muted-foreground uppercase">
                          {item.sku} · {item.color}
                        </p>
                      </div>
                      <button
                        type="button"
                        aria-label={`Remove ${item.name}`}
                        onClick={() => remove(item.slug, item.color)}
                        className="inline-flex size-9 shrink-0 items-center justify-center text-muted-foreground transition hover:bg-secondary hover:text-foreground"
                      >
                        <X className="size-4" />
                      </button>
                    </div>

                    <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
                      <div className="flex flex-wrap items-center gap-3">
                        <div className="inline-flex h-11 items-stretch border border-input">
                          <button
                            type="button"
                            aria-label="Decrease quantity"
                            className="w-11 transition hover:bg-secondary"
                            onClick={() => setQty(item.slug, item.color, item.qty - 1)}
                          >
                            <Minus className="mx-auto size-4" />
                          </button>
                          <span className="flex w-11 items-center justify-center border-x border-input text-sm tabular-nums">
                            {item.qty}
                          </span>
                          <button
                            type="button"
                            aria-label="Increase quantity"
                            className="w-11 transition hover:bg-secondary"
                            onClick={() => setQty(item.slug, item.color, item.qty + 1)}
                          >
                            <Plus className="mx-auto size-4" />
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={() => remove(item.slug, item.color)}
                          className="inline-flex h-11 items-center gap-1.5 text-xs tracking-wide text-muted-foreground uppercase transition hover:text-foreground"
                        >
                          <Trash2 className="size-3.5" />
                          Remove
                        </button>
                      </div>
                      <div className="text-right">
                        {item.comparePaisa ? (
                          <p className="text-xs text-muted-foreground line-through tabular-nums">
                            {formatPaisa(BigInt(item.comparePaisa) * BigInt(item.qty))}
                          </p>
                        ) : null}
                        <p className="text-base font-medium tabular-nums">
                          {formatPaisa(BigInt(item.linePaisa))}
                        </p>
                        <p className="text-xs text-muted-foreground tabular-nums">
                          {formatPaisa(BigInt(item.unitPaisa))} each
                        </p>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            <aside className="border border-border bg-white lg:sticky lg:top-[calc(var(--site-header-offset,7rem)+0.75rem)]">
              <div className="border-b border-border px-5 py-4">
                <p className="text-[11px] tracking-[0.18em] text-muted-foreground uppercase">
                  Order summary
                </p>
              </div>
              <div className="grid gap-3 px-5 py-5 text-sm">
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="tabular-nums">{formatPaisa(subtotal)}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Shipping</span>
                  <span className="text-muted-foreground">At checkout</span>
                </div>
                <div className="flex justify-between gap-4 border-t border-border pt-3 text-base font-medium">
                  <span>Total</span>
                  <span className="tabular-nums">{formatPaisa(subtotal)}</span>
                </div>
              </div>
              <div className="border-t border-border p-5">
                <Link
                  href="/checkout"
                  className="inline-flex h-12 w-full items-center justify-center bg-foreground text-sm font-medium tracking-[0.08em] text-background uppercase transition hover:opacity-90"
                >
                  Checkout
                </Link>
                <p className="mt-3 text-center text-xs leading-5 text-muted-foreground">
                  COD or Pay with EPS · we call before Pathao / Steadfast booking
                </p>
              </div>
            </aside>
          </div>
        )}

        {hydrated && suggestions.length > 0 ? (
          <section className="mt-14 border-t border-border pt-10">
            <p className="text-[11px] tracking-[0.22em] text-muted-foreground uppercase">
              You may also like
            </p>
            <h2 className="font-display mt-2 text-3xl tracking-tight">Complete the look</h2>
            <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {suggestions.map((product) => {
                const price = product.salePaisa ?? product.pricePaisa;
                return (
                  <li key={product.slug} className="border border-border bg-white p-3">
                    <Link
                      href={`/product/${product.slug}`}
                      className="relative block aspect-[4/5] overflow-hidden bg-neutral-100"
                    >
                      <Image
                        src={product.image}
                        alt={product.name}
                        fill
                        sizes="(min-width:1024px) 20vw, 45vw"
                        className="object-cover transition duration-500 hover:scale-105"
                      />
                      {product.isNew ? <NewBadge className="absolute top-2 right-2 z-10" /> : null}
                    </Link>
                    <p className="mt-3 line-clamp-2 text-sm font-medium leading-snug">
                      {product.name}
                    </p>
                    <div className="mt-2 flex items-center justify-between gap-2">
                      <span className="text-sm tabular-nums">{formatPaisa(price)}</span>
                      <button
                        type="button"
                        onClick={() =>
                          addToCart(product.slug, product.colors[0] ?? "Black", 1, {
                            inStock: product.inStock,
                            offer: product,
                          })
                        }
                        className="inline-flex h-9 items-center border border-foreground px-3 text-[11px] font-medium tracking-wide uppercase transition hover:bg-foreground hover:text-background"
                      >
                        + Add
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        ) : null}
      </div>
    </div>
  );
}
