"use client";

import { INITIAL_CATEGORIES, type StoreBrand } from "@bismillah/shared";
import { Menu, Search, ShoppingBag, User, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useCart } from "@/hooks/use-cart";
import { useStoreBrand } from "./brand-provider";
import { useCartUi } from "./cart-provider";

const categoryLinks = INITIAL_CATEGORIES;

function CartLink({ className }: { className: string }) {
  const { count, hydrated } = useCart();
  const { openCart } = useCartUi();
  return (
    <button
      type="button"
      onClick={openCart}
      className={`relative ${className}`}
      aria-label={hydrated ? `Cart, ${count} items` : "Cart"}
    >
      <ShoppingBag className="size-5" />
      {hydrated && count > 0 ? (
        <span className="absolute top-1 right-1 flex size-4 items-center justify-center rounded-full bg-foreground text-[9px] font-medium text-background">
          {count > 9 ? "9+" : count}
        </span>
      ) : null}
    </button>
  );
}

export function SiteHeader({ brand: brandProp }: { brand?: StoreBrand }) {
  const brandFromCtx = useStoreBrand();
  const brand = brandProp ?? brandFromCtx;
  const pathname = usePathname();
  const headerRef = useRef<HTMLElement>(null);
  const isHome = pathname === "/";
  const [open, setOpen] = useState(false);
  // Home starts in hero mode; non-home starts solid. Scroll measure corrects home.
  const [pastHero, setPastHero] = useState(() => pathname !== "/");
  const [offset, setOffset] = useState(112);

  /** Transparent brand + search over the hero — no category strip. */
  const overHero = isHome && !pastHero && !open;
  /** Solid bar + category nav after the hero (or on every other page). */
  const solidNav = !overHero;

  useEffect(() => {
    if (!isHome) {
      setPastHero(true);
      return;
    }

    // Assume over-hero until the first real measure proves otherwise.
    setPastHero(false);

    let raf = 0;
    let tries = 0;
    let found = false;

    const measure = () => {
      const hero = document.getElementById("site-hero");
      if (!hero) {
        tries += 1;
        if (tries < 120) raf = window.requestAnimationFrame(measure);
        return;
      }
      found = true;
      // Solid nav + categories only after the hero has fully scrolled away.
      const past = hero.getBoundingClientRect().bottom <= 8;
      setPastHero((prev) => (prev === past ? prev : past));
    };

    measure();
    window.addEventListener("scroll", measure, { passive: true });
    window.addEventListener("resize", measure);
    // Short poll while the home hero streams in after the layout header.
    const poll = window.setInterval(() => {
      measure();
      if (found) window.clearInterval(poll);
    }, 100);

    return () => {
      window.cancelAnimationFrame(raf);
      window.clearInterval(poll);
      window.removeEventListener("scroll", measure);
      window.removeEventListener("resize", measure);
    };
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
  }, [overHero, solidNav, open, pastHero]);

  return (
    <>
      <header
        ref={headerRef}
        data-over-hero={overHero ? "true" : "false"}
        data-past-hero={pastHero ? "true" : "false"}
        className={`fixed inset-x-0 top-0 z-[200] transition-[background-color,border-color,box-shadow,color] duration-300 ${
          overHero
            ? "border-b border-transparent bg-transparent text-white"
            : "border-b border-border bg-white text-foreground shadow-[0_4px_24px_rgba(0,0,0,0.06)]"
        }`}
      >
        {overHero ? (
          <div className="pt-[max(10px,env(safe-area-inset-top,0px))]">
            <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-3 py-3 sm:gap-4 sm:px-6 sm:py-4">
              <Link
                href="/"
                className="font-display shrink-0 text-base tracking-tight text-white sm:text-lg md:text-xl"
              >
                {brand.name}
              </Link>

              <form action="/search" className="w-[min(100%,16rem)] sm:w-[min(100%,20rem)] md:w-[22rem]">
                <label className="sr-only" htmlFor="hero-search">
                  Search products
                </label>
                <div className="relative">
                  <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-white/70" />
                  <input
                    id="hero-search"
                    name="q"
                    placeholder='Search "long wallet"'
                    className="h-11 w-full rounded-full border border-white/35 bg-white/10 pr-4 pl-11 text-sm text-white outline-none backdrop-blur-md placeholder:text-white/55 transition focus-visible:border-white focus-visible:bg-white/15"
                  />
                </div>
              </form>
            </div>
          </div>
        ) : (
          <>
            <div className="bg-black text-white pt-[max(0px,env(safe-area-inset-top,0px))]">
              <p className="truncate px-3 py-2 text-center text-[10px] leading-4 tracking-wide sm:px-4 sm:text-[11px] md:text-xs">
                <span className="sm:hidden">
                  COD · Dhaka ৳80 · Outside ৳130 · {brand.phoneDisplay}
                </span>
                <span className="hidden sm:inline">
                  COD · Dhaka ৳80 · Outside ৳130 · {brand.addressShort} · {brand.phoneDisplay}
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
                className="font-display max-w-[11rem] truncate text-center text-base tracking-tight sm:max-w-none sm:text-lg md:text-xl"
              >
                {brand.name}
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
                  href="/account"
                  className="inline-flex size-10 items-center justify-center rounded-full hover:bg-secondary"
                  aria-label="Account"
                >
                  <User className="size-5" />
                </Link>
                <CartLink className="inline-flex size-10 items-center justify-center rounded-full hover:bg-secondary" />
              </div>
            </div>

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
                <Link href="/account" className="flex h-11 items-center" onClick={() => setOpen(false)}>
                  My account
                </Link>
              </li>
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
              <li>
                <Link
                  href="/#flash-sale"
                  className="flex h-11 items-center"
                  onClick={() => setOpen(false)}
                >
                  Flash sale
                </Link>
              </li>
            </ul>
          </nav>
        ) : null}
      </header>

      <div
        aria-hidden="true"
        className={isHome ? "h-0" : undefined}
        style={isHome ? undefined : { height: offset }}
      />
    </>
  );
}
