"use client";

import { INITIAL_CATEGORIES, type StoreBrand } from "@bismillah/shared";
import { Menu, Search, ShoppingBag, User, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useCart } from "@/hooks/use-cart";
import { BrandLogo } from "./brand-logo";
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

  /** Transparent full-width search over the hero — no category strip. */
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
          <div className="pt-[max(12px,env(safe-area-inset-top,0px))]">
            <div className="mx-auto flex w-full max-w-[90rem] items-center gap-3 px-3 py-3 sm:gap-4 sm:px-6 sm:py-4 lg:px-10">
              <Link href="/" className="hidden shrink-0 sm:inline-flex" aria-label={brand.name}>
                <BrandLogo onDark size={36} className="size-9 drop-shadow-[0_1px_8px_rgba(0,0,0,0.35)]" />
              </Link>
              <form action="/search" className="min-w-0 flex-1">
                <label className="sr-only" htmlFor="hero-search">
                  Search products
                </label>
                <div className="group relative flex items-center overflow-hidden rounded-full border border-white/25 bg-white/[0.12] shadow-[0_12px_48px_rgba(0,0,0,0.28)] ring-1 ring-inset ring-white/10 backdrop-blur-2xl transition duration-300 focus-within:border-white/50 focus-within:bg-white/[0.18]">
                  <Search
                    className="pointer-events-none ml-5 size-5 shrink-0 text-white/70 transition group-focus-within:text-white sm:ml-6"
                    strokeWidth={1.75}
                  />
                  <input
                    id="hero-search"
                    name="q"
                    placeholder='Search "long wallet"'
                    className="h-12 min-w-0 flex-1 bg-transparent px-3.5 text-[15px] tracking-wide text-white outline-none placeholder:text-white/45 sm:h-14 sm:px-5 sm:text-base"
                  />
                  <button
                    type="submit"
                    className="mr-2 inline-flex h-9 shrink-0 items-center justify-center rounded-full bg-white px-4 text-sm font-medium tracking-wide text-black transition hover:bg-white/90 active:scale-[0.98] sm:mr-2.5 sm:h-11 sm:px-6"
                  >
                    Search
                  </button>
                </div>
              </form>
            </div>
          </div>
        ) : (
          <>
            <div className="relative mx-auto grid h-14 max-w-7xl grid-cols-[1fr_auto_1fr] items-center gap-2 px-2 pt-[max(0px,env(safe-area-inset-top,0px))] sm:h-16 sm:gap-3 sm:px-6">
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
                className="inline-flex max-w-[16rem] items-center justify-center gap-2.5 sm:max-w-none"
              >
                <BrandLogo size={42} className="h-9 w-9 sm:h-10 sm:w-10" />
                <span className="font-display text-base tracking-tight sm:text-lg md:text-xl">
                  {brand.name}
                </span>
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
