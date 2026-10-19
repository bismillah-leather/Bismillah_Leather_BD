"use client";

import { BRAND, INITIAL_CATEGORIES } from "@bismillah/shared";
import { Menu, Search, ShoppingBag, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const categoryLinks = INITIAL_CATEGORIES;

export function SiteHeader() {
  const pathname = usePathname();
  const headerRef = useRef<HTMLElement>(null);
  const isHome = pathname === "/";
  const [open, setOpen] = useState(false);
  const [pastHero, setPastHero] = useState(!isHome);
  const [offset, setOffset] = useState(112);
  /** Transparent brand + search over the hero image. */
  const overHero = isHome && !pastHero && !open;
  /** Solid Urbaland-style bar after the hero (or on every other page). */
  const solidNav = !overHero;

  useEffect(() => {
    if (!isHome) {
      setPastHero(true);
      return;
    }

    const hero = document.getElementById("site-hero");
    if (!hero) {
      setPastHero(true);
      return;
    }

    // Full solid nav (categories included) only after the hero has left the viewport.
    const observer = new IntersectionObserver(
      ([entry]) => {
        setPastHero(!entry?.isIntersecting);
      },
      { threshold: 0, rootMargin: "0px" },
    );

    observer.observe(hero);
    setPastHero(hero.getBoundingClientRect().bottom <= 0);

    return () => observer.disconnect();
  }, [isHome, pathname]);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    const node = headerRef.current;
    if (!node) return;

    const publish = () => {
      const height = Math.ceil(node.getBoundingClientRect().height);
      setOffset(height);
      document.documentElement.style.setProperty("--site-header-offset", `${height}px`);
    };

    publish();
    const observer = new ResizeObserver(publish);
    observer.observe(node);
    window.addEventListener("orientationchange", publish);
    return () => {
      observer.disconnect();
      window.removeEventListener("orientationchange", publish);
    };
  }, [overHero, solidNav, open]);

  return (
    <>
      <header
        ref={headerRef}
        className={`fixed inset-x-0 top-0 z-50 transition-[background-color,border-color,box-shadow,color,transform] duration-300 ${
          overHero
            ? "border-b border-transparent bg-transparent text-white"
            : "border-b border-border bg-white text-foreground shadow-[0_4px_24px_rgba(0,0,0,0.06)]"
        }`}
      >
        {overHero ? (
          <div className="pt-[max(10px,env(safe-area-inset-top,0px))]">
            <div className="mx-auto flex max-w-7xl items-center gap-3 px-3 py-3 sm:gap-4 sm:px-6 sm:py-4">
              <Link
                href="/"
                className="font-display shrink-0 text-lg tracking-tight drop-shadow-sm sm:text-2xl md:text-[1.65rem]"
              >
                {BRAND.name}
              </Link>

              <form action="/search" className="ml-auto min-w-0 flex-1 sm:max-w-md">
                <label className="sr-only" htmlFor="hero-search">
                  Search products
                </label>
                <div className="relative">
                  <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-white/75" />
                  <input
                    id="hero-search"
                    name="q"
                    placeholder='Search "long wallet"'
                    className="h-10 w-full rounded-full border border-white/50 bg-black/25 pr-4 pl-10 text-sm text-white outline-none backdrop-blur-sm placeholder:text-white/65 focus-visible:border-white sm:h-11"
                  />
                </div>
              </form>
            </div>
          </div>
        ) : (
          <>
            <div className="bg-black text-white pt-[max(0px,env(safe-area-inset-top,0px))]">
              <p className="truncate px-3 py-2 text-center text-[10px] leading-4 tracking-wide sm:px-4 sm:text-[11px] md:text-xs">
                <span className="sm:hidden">COD · Dhaka ৳80 · Outside ৳130 · {BRAND.phoneDisplay}</span>
                <span className="hidden sm:inline">
                  COD · Dhaka ৳80 · Outside ৳130 · {BRAND.addressShort} · {BRAND.phoneDisplay}
                </span>
              </p>
            </div>

            <div className="relative mx-auto grid h-14 max-w-7xl grid-cols-[1fr_auto_1fr] items-center gap-2 px-2 sm:h-16 sm:gap-3 sm:px-6">
              <div className="flex min-w-0 items-center gap-1">
                <button
                  type="button"
                  className="inline-flex size-10 shrink-0 items-center justify-center rounded-md hover:bg-secondary lg:hidden"
                  aria-expanded={open}
                  aria-controls="mobile-nav"
                  onClick={() => setOpen((value) => !value)}
                >
                  {open ? <X className="size-5" /> : <Menu className="size-5" />}
                  <span className="sr-only">{open ? "Close menu" : "Open menu"}</span>
                </button>

                <form action="/search" className="hidden min-w-0 flex-1 md:block">
                  <label className="sr-only" htmlFor="site-search">
                    Search products
                  </label>
                  <div className="relative max-w-xs">
                    <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                      id="site-search"
                      name="q"
                      placeholder="Search for items..."
                      className="h-10 w-full rounded-full border border-input bg-secondary/60 pr-4 pl-10 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-foreground focus-visible:bg-white sm:h-11"
                    />
                  </div>
                </form>
              </div>

              <Link
                href="/"
                className="font-display max-w-[11rem] truncate text-center text-lg tracking-tight sm:max-w-none sm:text-xl md:text-2xl"
              >
                {BRAND.name}
              </Link>

              <div className="flex items-center justify-end gap-0.5 sm:gap-1">
                <Link
                  href="/search"
                  className="inline-flex size-10 items-center justify-center rounded-full hover:bg-secondary md:hidden"
                  aria-label="Search"
                >
                  <Search className="size-5" />
                </Link>
                <Link
                  href="/checkout"
                  className="inline-flex size-10 items-center justify-center rounded-full hover:bg-secondary"
                  aria-label="Cart"
                >
                  <ShoppingBag className="size-5" />
                </Link>
              </div>
            </div>

            <nav
              aria-label="Categories"
              className="hidden border-t border-border lg:block"
            >
              <ul className="mx-auto flex max-w-7xl items-center justify-center gap-1 overflow-x-auto px-4 py-2.5 text-sm sm:px-6">
                {categoryLinks.map((category) => (
                  <li key={category.slug}>
                    <Link
                      href={`/category/${category.slug}`}
                      className="inline-flex h-9 items-center whitespace-nowrap px-3 text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {category.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </>
        )}

        {open && solidNav ? (
          <nav
            id="mobile-nav"
            className="max-h-[min(75dvh,32rem)] overflow-y-auto overscroll-contain border-t border-border bg-white px-4 py-4 text-foreground lg:hidden"
          >
            <form action="/search" className="mb-4 md:hidden">
              <label className="sr-only" htmlFor="mobile-search">
                Search products
              </label>
              <div className="relative">
                <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  id="mobile-search"
                  name="q"
                  placeholder="Search for items..."
                  className="h-11 w-full rounded-full border border-input bg-secondary/60 pr-4 pl-10 text-sm outline-none focus-visible:border-foreground"
                />
              </div>
            </form>
            <p className="text-xs tracking-[0.18em] text-muted-foreground uppercase">Shop</p>
            <ul className="mt-2">
              {categoryLinks.map((category) => (
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
            <ul className="mt-4 grid gap-1 border-t border-border pt-3 text-sm">
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
          </nav>
        ) : null}
      </header>

      {/* Non-home: push content below fixed header. Home hero stays full-bleed. */}
      <div
        aria-hidden="true"
        className={isHome ? "h-0" : undefined}
        style={isHome ? undefined : { height: offset }}
      />
    </>
  );
}
