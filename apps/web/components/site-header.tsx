"use client";

import { BRAND, INITIAL_CATEGORIES } from "@bismillah/shared";
import { Menu, Search, ShoppingBag, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const walletLinks = INITIAL_CATEGORIES.filter((category) => category.group === "Wallets");
const beltLinks = INITIAL_CATEGORIES.filter((category) => category.group === "Belts");

export function SiteHeader() {
  const pathname = usePathname();
  const headerRef = useRef<HTMLElement>(null);
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [offset, setOffset] = useState(112);

  const isHome = pathname === "/";
  const isCategory = pathname.startsWith("/category/");
  const underHeader = isHome || isCategory;
  const overMedia = underHeader && !scrolled && !open;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
    setScrolled(window.scrollY > 16);
  }, [pathname]);

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
  }, [overMedia, open]);

  return (
    <>
      <header
        ref={headerRef}
        className={`fixed inset-x-0 top-0 z-50 transition-[background-color,border-color,box-shadow,color] duration-300 ${
          overMedia
            ? "border-b border-transparent bg-gradient-to-b from-black from-40% via-black/70 to-transparent text-white"
            : "border-b border-border bg-white/95 text-foreground shadow-[0_8px_30px_rgba(0,0,0,0.06)] backdrop-blur-md"
        }`}
      >
        <div
          className={`pt-[max(0.75rem,env(safe-area-inset-top,0px))] ${
            overMedia ? "text-white" : "bg-black text-white"
          }`}
        >
          <p className="px-3 py-2.5 text-center text-[10px] leading-5 tracking-wide sm:px-4 sm:py-3 sm:text-[11px] md:text-xs">
            <span className="sm:hidden">COD · Dhaka ৳80 · Outside ৳130 · {BRAND.phoneDisplay}</span>
            <span className="hidden sm:inline">
              COD · Dhaka ৳80 · Outside ৳130 · {BRAND.addressShort} · {BRAND.phoneDisplay}
            </span>
          </p>
        </div>

        <div>
          <div className="mx-auto flex min-h-16 max-w-7xl items-center gap-2 px-3 py-3 sm:min-h-[4.5rem] sm:gap-3 sm:px-6 sm:py-3.5">
            <button
              type="button"
              className={`inline-flex size-10 shrink-0 items-center justify-center rounded-md sm:size-11 lg:hidden ${
                overMedia ? "hover:bg-white/10" : "hover:bg-secondary"
              }`}
              aria-expanded={open}
              aria-controls="mobile-nav"
              onClick={() => setOpen((value) => !value)}
            >
              {open ? <X className="size-5" /> : <Menu className="size-5" />}
              <span className="sr-only">{open ? "Close menu" : "Open menu"}</span>
            </button>

            <Link
              href="/"
              className="font-display shrink-0 text-lg tracking-tight sm:text-xl md:text-2xl"
            >
              Bismillah
            </Link>

            <nav className="ml-2 hidden items-center gap-4 text-sm lg:ml-4 lg:flex lg:gap-5">
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
                    overMedia ? "text-white/70" : "text-muted-foreground"
                  }`}
                />
                <input
                  id="site-search"
                  name="q"
                  placeholder='Search "long wallet"'
                  className={`h-10 w-full rounded-full border pr-4 pl-10 text-sm outline-none sm:h-11 ${
                    overMedia
                      ? "border-white/45 bg-white/10 text-white placeholder:text-white/65 focus-visible:border-white"
                      : "border-input bg-white text-foreground placeholder:text-muted-foreground focus-visible:border-foreground"
                  }`}
                />
              </div>
            </form>

            <Link
              href="/search"
              className={`ml-auto inline-flex size-10 shrink-0 items-center justify-center rounded-full sm:size-11 md:hidden ${
                overMedia ? "hover:bg-white/10" : "hover:bg-secondary"
              }`}
              aria-label="Search"
            >
              <Search className="size-5" />
            </Link>
            <Link
              href="/checkout"
              className={`inline-flex size-10 shrink-0 items-center justify-center rounded-full sm:size-11 ${
                overMedia ? "hover:bg-white/10" : "hover:bg-secondary"
              }`}
              aria-label="Cart"
            >
              <ShoppingBag className="size-5" />
            </Link>
          </div>
        </div>

        {open ? (
          <nav
            id="mobile-nav"
            className="max-h-[min(70vh,28rem)] overflow-y-auto border-t border-border bg-white px-4 py-4 text-foreground lg:hidden"
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

      <div
        aria-hidden="true"
        className={underHeader ? "h-0" : undefined}
        style={underHeader ? undefined : { height: offset }}
      />
    </>
  );
}
