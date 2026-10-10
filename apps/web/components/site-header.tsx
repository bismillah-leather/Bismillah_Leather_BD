"use client";

import { BRAND, INITIAL_CATEGORIES } from "@bismillah/shared";
import { Menu, Search, ShoppingBag, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const walletLinks = INITIAL_CATEGORIES.filter((category) => category.group === "Wallets");
const beltLinks = INITIAL_CATEGORIES.filter((category) => category.group === "Belts");

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const isHome = pathname === "/";
  const overHero = isHome && !scrolled && !open;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-40 transition-[background-color,border-color,box-shadow,backdrop-filter] duration-300 ${
          overHero
            ? "border-b border-transparent bg-transparent text-white"
            : "border-b border-border bg-[#f6f3ee]/95 text-foreground shadow-[0_8px_30px_rgba(22,18,14,0.08)] backdrop-blur-md"
        }`}
      >
        <div
          className={`overflow-hidden transition-[max-height,opacity] duration-300 ${
            overHero ? "max-h-0 opacity-0" : "max-h-12 opacity-100"
          }`}
        >
          <div className="bg-foreground px-4 py-2 text-center text-[11px] tracking-wide text-background sm:text-xs">
            COD · Dhaka ৳80 · Outside ৳130 · {BRAND.addressShort} · {BRAND.phoneDisplay}
          </div>
        </div>

        <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:px-6">
          <button
            type="button"
            className={`inline-flex size-11 items-center justify-center rounded-md lg:hidden ${
              overHero ? "hover:bg-white/10" : "hover:bg-secondary"
            }`}
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
            <Link className="hover:underline" href="/search">
              New
            </Link>
            <Link className="hover:underline" href="/category/long-wallet">
              Wallets
            </Link>
            <Link className="hover:underline" href="/category/formal-belt">
              Belts
            </Link>
            <Link className="hover:underline" href="/search?q=sale">
              Sale
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
              <Search
                className={`pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 ${
                  overHero ? "text-white/70" : "text-muted-foreground"
                }`}
              />
              <input
                id="site-search"
                name="q"
                placeholder='Search "long wallet"'
                className={`h-11 w-full rounded-full border pr-4 pl-10 text-sm outline-none ${
                  overHero
                    ? "border-white/45 bg-white/10 text-white placeholder:text-white/65 focus-visible:border-white"
                    : "border-input bg-white text-foreground placeholder:text-muted-foreground focus-visible:border-foreground"
                }`}
              />
            </div>
          </form>

          <Link
            href="/search"
            className={`ml-auto inline-flex size-11 items-center justify-center rounded-full md:hidden ${
              overHero ? "hover:bg-white/10" : "hover:bg-secondary"
            }`}
            aria-label="Search"
          >
            <Search className="size-5" />
          </Link>
          <Link
            href="/checkout"
            className={`inline-flex size-11 items-center justify-center rounded-full ${
              overHero ? "hover:bg-white/10" : "hover:bg-secondary"
            }`}
            aria-label="Cart"
          >
            <ShoppingBag className="size-5" />
          </Link>
        </div>

        {open ? (
          <nav
            id="mobile-nav"
            className="max-h-[70vh] overflow-y-auto border-t border-border bg-[#f6f3ee] px-4 py-4 text-foreground lg:hidden"
          >
            <ul className="mb-4 grid gap-1 text-sm">
              <li>
                <Link href="/search" className="flex h-11 items-center" onClick={() => setOpen(false)}>
                  New arrivals
                </Link>
              </li>
              <li>
                <Link
                  href="/search?q=sale"
                  className="flex h-11 items-center"
                  onClick={() => setOpen(false)}
                >
                  Sale
                </Link>
              </li>
            </ul>
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

      {/* Home hero stays full-bleed under the bar; other pages need clearance */}
      <div aria-hidden="true" className={isHome ? "h-0" : "h-[6.5rem]"} />
    </>
  );
}
