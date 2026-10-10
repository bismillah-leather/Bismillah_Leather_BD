"use client";

import { Button } from "@bismillah/ui";
import { INITIAL_CATEGORIES } from "@bismillah/shared";
import { Menu, Search, ShoppingBag, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

const walletLinks = INITIAL_CATEGORIES.filter((category) => category.group === "Wallets");
const beltLinks = INITIAL_CATEGORIES.filter((category) => category.group === "Belts");

export function SiteHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-border/80 bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4 sm:px-6">
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          aria-expanded={open}
          aria-controls="mobile-nav"
          onClick={() => setOpen((value) => !value)}
        >
          {open ? <X /> : <Menu />}
          <span className="sr-only">{open ? "Close menu" : "Open menu"}</span>
        </Button>

        <Link href="/" className="font-display text-xl tracking-tight">
          Bismillah Leather
        </Link>

        <nav className="ml-6 hidden items-center gap-6 text-sm text-muted-foreground lg:flex">
          <Link className="hover:text-foreground" href="/category/long-wallet">
            Wallets
          </Link>
          <Link className="hover:text-foreground" href="/category/formal-belt">
            Belts
          </Link>
        </nav>

        <form action="/search" className="ml-auto hidden min-w-0 flex-1 md:block md:max-w-xs">
          <label className="sr-only" htmlFor="site-search">
            Search products
          </label>
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              id="site-search"
              name="q"
              placeholder="Search"
              className="h-11 w-full rounded-md border border-input bg-card pr-3 pl-9 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring"
            />
          </div>
        </form>

        <Link
          href="/search"
          className="ml-auto inline-flex size-11 items-center justify-center rounded-md hover:bg-secondary md:hidden"
          aria-label="Search"
        >
          <Search className="size-4" />
        </Link>
        <span
          className="inline-flex size-11 items-center justify-center rounded-md text-muted-foreground"
          aria-label="Cart is empty"
        >
          <ShoppingBag className="size-4" />
        </span>
      </div>

      {open ? (
        <nav id="mobile-nav" className="border-t border-border px-4 py-4 lg:hidden">
          <p className="text-xs tracking-[0.18em] text-muted-foreground uppercase">Wallets</p>
          <ul className="mt-2 grid gap-1">
            {walletLinks.map((category) => (
              <li key={category.slug}>
                <Link
                  href={`/category/${category.slug}`}
                  className="flex h-11 items-center rounded-md px-2 hover:bg-secondary"
                  onClick={() => setOpen(false)}
                >
                  {category.name}
                </Link>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xs tracking-[0.18em] text-muted-foreground uppercase">Belts</p>
          <ul className="mt-2 grid gap-1">
            {beltLinks.map((category) => (
              <li key={category.slug}>
                <Link
                  href={`/category/${category.slug}`}
                  className="flex h-11 items-center rounded-md px-2 hover:bg-secondary"
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
