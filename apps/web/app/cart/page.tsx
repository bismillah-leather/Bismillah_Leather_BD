"use client";

import { formatPaisa } from "@bismillah/shared";
import { Minus, Plus, Trash2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/hooks/use-cart";

export default function CartPage() {
  const { hydrated, items, setQty, remove } = useCart();
  const subtotal = items.reduce((sum, item) => sum + BigInt(item.linePaisa), 0n);

  return (
    <div className="bg-secondary/25">
      <div className="border-b border-border bg-white">
        <div className="mx-auto flex max-w-5xl items-end justify-between gap-4 px-4 py-8 sm:px-6 sm:py-10">
          <div>
            <p className="text-[11px] tracking-[0.22em] text-muted-foreground uppercase">Bag</p>
            <h1 className="font-display mt-1 text-4xl tracking-tight sm:text-5xl">Your cart</h1>
          </div>
          <Link href="/#all-products" className="text-sm underline underline-offset-4">
            Continue shopping
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
        {!hydrated ? (
          <p className="text-sm text-muted-foreground">Loading cart…</p>
        ) : items.length === 0 ? (
          <div className="border border-border bg-white px-6 py-16 text-center">
            <p className="font-display text-3xl tracking-tight">Your cart is empty</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Add a wallet or belt, then come back to checkout.
            </p>
            <Link
              href="/#all-products"
              className="mt-6 inline-flex h-12 items-center bg-foreground px-5 text-sm font-medium text-background"
            >
              Browse products
            </Link>
          </div>
        ) : (
          <div className="grid gap-8 lg:grid-cols-[1fr_20rem] lg:items-start">
            <ul className="grid gap-3">
              {items.map((item) => (
                <li
                  key={`${item.slug}-${item.color}`}
                  className="grid gap-4 border border-border bg-white p-4 sm:grid-cols-[6rem_1fr_auto] sm:items-center sm:p-5"
                >
                  <Link
                    href={`/product/${item.slug}`}
                    className="relative aspect-square overflow-hidden bg-neutral-100"
                  >
                    <Image src={item.image} alt={item.name} fill sizes="96px" className="object-cover" />
                  </Link>
                  <div className="min-w-0">
                    <Link href={`/product/${item.slug}`}>
                      <h2 className="font-display text-xl tracking-tight">{item.name}</h2>
                    </Link>
                    <p className="mt-1 text-xs tracking-[0.12em] text-muted-foreground uppercase">
                      {item.sku} · {item.color}
                    </p>
                    <p className="mt-2 text-sm font-medium tabular-nums">
                      {formatPaisa(BigInt(item.unitPaisa))}
                    </p>
                    <div className="mt-3 flex flex-wrap items-center gap-3">
                      <div className="inline-flex h-10 items-stretch border border-input">
                        <button
                          type="button"
                          aria-label="Decrease quantity"
                          className="w-10 hover:bg-secondary"
                          onClick={() => setQty(item.slug, item.color, item.qty - 1)}
                        >
                          <Minus className="mx-auto size-4" />
                        </button>
                        <span className="flex w-10 items-center justify-center border-x border-input text-sm tabular-nums">
                          {item.qty}
                        </span>
                        <button
                          type="button"
                          aria-label="Increase quantity"
                          className="w-10 hover:bg-secondary"
                          onClick={() => setQty(item.slug, item.color, item.qty + 1)}
                        >
                          <Plus className="mx-auto size-4" />
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => remove(item.slug, item.color)}
                        className="inline-flex h-10 items-center gap-1.5 text-xs tracking-wide text-muted-foreground uppercase hover:text-foreground"
                      >
                        <Trash2 className="size-3.5" />
                        Remove
                      </button>
                    </div>
                  </div>
                  <p className="text-sm font-medium tabular-nums sm:text-right">
                    {formatPaisa(BigInt(item.linePaisa))}
                  </p>
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
                  <span className="text-muted-foreground">Calculated at checkout</span>
                </div>
                <div className="flex justify-between gap-4 border-t border-border pt-3 text-base font-medium">
                  <span>Estimated total</span>
                  <span className="tabular-nums">{formatPaisa(subtotal)}</span>
                </div>
              </div>
              <div className="border-t border-border p-5">
                <Link
                  href="/checkout"
                  className="inline-flex h-12 w-full items-center justify-center bg-foreground text-sm font-medium tracking-[0.06em] text-background uppercase"
                >
                  Checkout
                </Link>
                <p className="mt-3 text-center text-xs text-muted-foreground">
                  Cash on delivery · we call before dispatch
                </p>
              </div>
            </aside>
          </div>
        )}
      </div>
    </div>
  );
}
