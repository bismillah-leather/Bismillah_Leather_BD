"use client";

import { INITIAL_CATEGORIES } from "@bismillah/shared";
import { Menu, Search, ShoppingBag, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

const walletLinks = INITIAL_CATEGORIES.filter((category) => category.group === "Wallets");
const beltLinks = INITIAL_CATEGORIES.filter((category) => category.group === "Belts");

export function SiteHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur-md">
      <div className="bg-foreground px-4 py-2 text-center text-[11px] tracking-wide text-background sm:text-xs">
        Cash on delivery · Inside Dhaka ৳80 · Outside Dhaka ৳130
      </div>
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:px-6">
        <button
          type="button"
          className="inline-flex size-11 items-center justify-center rounded-md hover:bg-secondary lg:hidden"
          aria-expanded={open}
          aria-controls="mobile-nav"
          onClick={() => setOpen((value) => !value)}
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
          <span className="sr-only">{open ? "Close menu" : "Open menu"}</span>
        </button>

        <Link href="/" className="font-display text-xl tracking-tight sm:text-2xl">
          Bismillah
        </Link>

        <nav className="ml-4 hidden items-center gap-5 text-sm lg:flex">
          <Link className="hover:underline" href="/category/long-wallet">
            Wallets
          </Link>
          <Link className="hover:underline" href="/category/formal-belt">
            Belts
          </Link>
          <Link className="hover:underline" href="/search">
            Shop all
          </Link>
        </nav>

        <form action="/search" className="ml-auto hidden min-w-0 flex-1 md:block md:max-w-md">
          <label className="sr-only" htmlFor="site-search">
            Search products
          </label>
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              id="site-search"
              name="q"
              placeholder='Search "long wallet"'
              className="h-11 w-full rounded-full border border-input bg-white pr-4 pl-10 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-foreground"
            />
          </div>
        </form>

        <Link
          href="/search"
          className="ml-auto inline-flex size-11 items-center justify-center rounded-full hover:bg-secondary md:hidden"
          aria-label="Search"
        >
          <Search className="size-5" />
        </Link>
        <Link
          href="/checkout"
          className="inline-flex size-11 items-center justify-center rounded-full hover:bg-secondary"
          aria-label="Cart"
        >
          <ShoppingBag className="size-5" />
        </Link>
      </div>

      {open ? (
        <nav id="mobile-nav" className="max-h-[70vh] overflow-y-auto border-t border-border bg-background px-4 py-4 lg:hidden">
          <p className="text-xs tracking-[0.18em] text-muted-foreground uppercase">Wallets</p>
          <ul className="mt-2">
            {walletLinks.map((category) => (
              <li key={category.slug}>
                <Link
                  href={`/category/${category.slug}`}
                  className="flex h-11 items-center"
                  onClick={() => setOpen(false)}
                >
                  {category.name}
                </Link>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xs tracking-[0.18em] text-muted-foreground uppercase">Belts</p>
          <ul className="mt-2">
            {beltLinks.map((category) => (
              <li key={category.slug}>
                <Link
                  href={`/category/${category.slug}`}
                  className="flex h-11 items-center"
                  onClick={() => setOpen(false)}
                >
                  {category.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      ) : null}
    </header>
  );
}
