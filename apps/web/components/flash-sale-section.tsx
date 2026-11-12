"use client";

import {
  flashSaleCountdown,
  flashSaleItemForSlug,
  flashSalePricePaisa,
  flashSaleProducts,
  formatPaisa,
  isFlashSaleLive,
  type FlashSaleConfig,
  type ShowcaseProduct,
} from "@bismillah/shared";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { LiveViewers } from "./live-viewers";
import { NewBadge } from "./new-badge";
import { ProductCardActions } from "./product-card-actions";

const AUTO_MS = 4800;

function pad2(n: number) {
  return n.toString().padStart(2, "0");
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function shortestOffset(raw: number, length: number) {
  let value = raw;
  const half = length / 2;
  while (value > half) value -= length;
  while (value < -half) value += length;
  return value;
}

function discountLabel(sale: FlashSaleConfig) {
  if (sale.discountKind === "percent") {
    const pct = Number(sale.discountValue) / 100;
    return `${pct % 1 === 0 ? pct.toFixed(0) : pct.toFixed(1)}% OFF`;
  }
  const taka = Number(sale.discountValue) / 100;
  return `৳${taka.toLocaleString("en-BD")} OFF`;
}

function CountdownDigit({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative overflow-hidden border border-white/20 bg-white/95 text-black backdrop-blur">
        <span
          key={value}
          className="font-display block min-w-[2rem] px-1.5 py-1 text-center text-base leading-none tracking-tight tabular-nums sm:min-w-[2.4rem] sm:px-2 sm:py-1.5 sm:text-xl animate-[flash-tick_0.35s_ease-out]"
        >
          {value}
        </span>
        <span aria-hidden className="pointer-events-none absolute inset-x-0 top-1/2 h-px bg-black/10" />
      </div>
      <span className="text-[9px] tracking-[0.18em] text-white/50 uppercase sm:text-[10px]">
        {label}
      </span>
    </div>
  );
}

function FlashCountdown({ endsAt }: { endsAt: string }) {
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    setNow(Date.now());
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  if (now == null) {
    return <div className="h-12 w-44" aria-hidden />;
  }

  const parts = flashSaleCountdown(endsAt, new Date(now));
  if (parts.expired) {
    return <p className="text-xs tracking-[0.14em] text-white/60 uppercase">Sale ended</p>;
  }

  const hours = parts.hours;
  const showDays = hours >= 24;
  const days = Math.floor(hours / 24);
  const remHours = hours % 24;

  return (
    <div className="flex items-end gap-1.5 sm:gap-2" aria-live="polite">
      {showDays ? (
        <>
          <CountdownDigit value={pad2(days)} label="Days" />
          <span className="mb-5 text-lg text-white/35">:</span>
        </>
      ) : null}
      <CountdownDigit value={pad2(showDays ? remHours : hours)} label="Hrs" />
      <span className="mb-5 text-lg text-white/35">:</span>
      <CountdownDigit value={pad2(parts.minutes)} label="Min" />
      <span className="mb-5 text-lg text-white/35">:</span>
      <CountdownDigit value={pad2(parts.seconds)} label="Sec" />
    </div>
  );
}

function stageSpacing() {
  if (typeof window === "undefined") return 280;
  if (window.matchMedia("(min-width: 1280px)").matches) return 420;
  if (window.matchMedia("(min-width: 1024px)").matches) return 360;
  if (window.matchMedia("(min-width: 640px)").matches) return 300;
  return 240;
}

export function FlashSaleSection({
  sale: initialSale,
  catalog,
}: {
  sale: FlashSaleConfig;
  catalog?: readonly ShowcaseProduct[];
}) {
  const [sale, setSale] = useState(initialSale);
  const [now, setNow] = useState(() => Date.now());
  const products = useMemo(
    () => flashSaleProducts(sale, new Date(now), catalog),
    [sale, now, catalog],
  );

  const trackRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{
    pointerId: number;
    startX: number;
    origin: number;
    moved: boolean;
  } | null>(null);
  const suppressClickRef = useRef(false);
  const pauseUntilRef = useRef(0);

  const [active, setActive] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [paused, setPaused] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [spacing, setSpacing] = useState(280);

  useEffect(() => {
    setSale(initialSale);
  }, [initialSale]);

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/flash-sale", { cache: "no-store" });
        if (!res.ok) return;
        const next = (await res.json()) as FlashSaleConfig;
        if (!cancelled) setSale(next);
      } catch {
        /* keep SSR payload */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    setActive(0);
  }, [sale.id, sale.endsAt, sale.items, products.length]);

  useEffect(() => {
    if (products.length === 0) return;
    setActive((value) => Math.min(value, products.length - 1));
  }, [products.length]);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduceMotion(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    const measure = () => setSpacing(stageSpacing());
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  const bumpPause = () => {
    pauseUntilRef.current = performance.now() + 5200;
  };

  const step = (delta: number) => {
    if (products.length < 2) return;
    bumpPause();
    setActive((value) => (value + delta + products.length) % products.length);
  };

  const goTo = (index: number) => {
    bumpPause();
    setActive(index);
  };

  useEffect(() => {
    if (paused || dragging || products.length < 2) return;
    const timer = window.setInterval(() => {
      if (performance.now() < pauseUntilRef.current) return;
      if (document.hidden) return;
      setActive((value) => (value + 1) % products.length);
    }, AUTO_MS);
    return () => window.clearInterval(timer);
  }, [dragging, paused, products.length]);

  useEffect(() => {
    const node = trackRef.current;
    if (!node || products.length < 2) return;

    let lastStep = 0;
    const onWheel = (event: WheelEvent) => {
      const dominant =
        Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
      if (Math.abs(dominant) < 12) return;
      event.preventDefault();
      const now = performance.now();
      if (now - lastStep < 320) return;
      lastStep = now;
      bumpPause();
      setActive((value) => (value + (dominant > 0 ? 1 : -1) + products.length) % products.length);
    };

    node.addEventListener("wheel", onWheel, { passive: false });
    return () => node.removeEventListener("wheel", onWheel);
  }, [products.length]);

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.button !== 0 || products.length < 2) return;
    trackRef.current?.setPointerCapture(event.pointerId);
    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      origin: active,
      moved: false,
    };
    setDragging(true);
    setDragOffset(0);
  };

  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const delta = event.clientX - drag.startX;
    if (Math.abs(delta) > 8) drag.moved = true;
    setDragOffset(delta);
  };

  const endDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    if (drag.moved) {
      suppressClickRef.current = true;
      window.setTimeout(() => {
        suppressClickRef.current = false;
      }, 0);
    }
    const shift = Math.round(-dragOffset / spacing);
    const next = ((drag.origin + shift) % products.length + products.length) % products.length;
    dragRef.current = null;
    setDragging(false);
    bumpPause();
    setActive(next);
    setDragOffset(0);
  };

  const live = isFlashSaleLive(sale, new Date(now));
  if (!sale.isActive || !live || products.length === 0) {
    return null;
  }

  const featured = products[active] ?? products[0]!;
  const featuredItem = flashSaleItemForSlug(sale, featured.slug);
  const featuredEndsAt = featuredItem?.endsAt ?? sale.endsAt;
  const visualActive = active - dragOffset / spacing;
  const offLabel = discountLabel(sale);

  return (
    <section id="flash-sale" className="flash-stage relative overflow-hidden bg-black text-white">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.055]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 18% 22%, #fff 0.55px, transparent 0.65px), radial-gradient(circle at 78% 68%, #fff 0.55px, transparent 0.65px)",
          backgroundSize: "32px 32px, 44px 44px",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute top-1/2 left-1/2 h-[48rem] w-[48rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/[0.06] blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black via-black/40 to-transparent"
      />

      <div className="relative mx-auto max-w-7xl px-3 pt-8 sm:px-6 sm:pt-10 lg:pt-12">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-lg">
            <p className="inline-flex items-center gap-2 text-[10px] tracking-[0.28em] text-white/50 uppercase sm:text-[11px]">
              <span className="relative flex size-1.5">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-white opacity-35" />
                <span className="relative inline-flex size-1.5 rounded-full bg-white" />
              </span>
              Live drop
            </p>
            <h2 className="font-display mt-2 text-2xl tracking-tight sm:text-3xl md:text-4xl lg:text-5xl">
              {sale.title}
            </h2>
            <p className="mt-2 max-w-md text-xs leading-5 text-white/60 sm:text-sm sm:leading-6">
              {sale.subtitle}
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <span className="bg-white px-3 py-1.5 text-[11px] font-medium tracking-[0.16em] text-black uppercase">
                {offLabel}
              </span>
              <span className="text-[11px] tracking-[0.16em] text-white/40 uppercase">
                Scroll · drag · next
              </span>
            </div>
          </div>

          <div className="lg:pt-2">
            <p className="mb-2 text-[10px] tracking-[0.22em] text-white/40 uppercase">
              {featured.name} · ends in
            </p>
            <FlashCountdown endsAt={featuredEndsAt} />
          </div>
        </div>
      </div>

      <div
        className="relative isolate mt-8 sm:mt-10"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        <p className="sr-only">
          Flash sale products advance one at a time. Scroll, drag, or use the arrows to move.
        </p>

        <div
          ref={trackRef}
          className="relative mx-auto h-[28rem] touch-pan-y select-none overflow-hidden sm:h-[34rem] lg:h-[38rem]"
          style={{ perspective: reduceMotion ? undefined : "1600px" }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          role="listbox"
          aria-label="Flash sale products"
          aria-activedescendant={`flash-item-${featured.slug}`}
          tabIndex={0}
          onKeyDown={(event) => {
            if (event.key === "ArrowLeft") {
              event.preventDefault();
              step(-1);
            } else if (event.key === "ArrowRight") {
              event.preventDefault();
              step(1);
            }
          }}
        >
          <div className="pointer-events-none absolute inset-y-0 left-0 z-30 w-10 bg-gradient-to-r from-black to-transparent sm:w-24 lg:w-36" />
          <div className="pointer-events-none absolute inset-y-0 right-0 z-30 w-10 bg-gradient-to-l from-black to-transparent sm:w-24 lg:w-36" />

          <ul className="absolute inset-0 flex items-center justify-center">
            {products.map((product, index) => {
              const offset = shortestOffset(index - visualActive, products.length);
              const abs = Math.abs(offset);
              const scale = clamp(1.08 - abs * 0.16, 0.62, 1.1);
              const x = offset * spacing;
              const z = reduceMotion ? 0 : clamp(90 - abs * 55, -40, 100);
              const yaw = reduceMotion ? 0 : clamp(offset * -14, -32, 32);
              const opacity = clamp(1.2 - abs * 0.28, 0.2, 1);
              const zIndex = Math.round(160 - abs * 18);
              const isCenter = abs < 0.55;
              const price = flashSalePricePaisa(product.pricePaisa, sale, product.slug);

              return (
                <li
                  key={product.slug}
                  id={`flash-item-${product.slug}`}
                  role="option"
                  aria-selected={index === active}
                  className="absolute"
                  style={{
                    width: "var(--flash-card-w)",
                    height: "var(--flash-card-h)",
                    transform: `translate3d(${x}px, 0, ${z}px) rotateY(${yaw}deg) scale(${scale})`,
                    transformStyle: "preserve-3d",
                    zIndex,
                    opacity,
                    transition: dragging
                      ? "none"
                      : reduceMotion
                        ? "transform 220ms ease, opacity 220ms ease"
                        : "transform 720ms cubic-bezier(0.16, 1, 0.3, 1), opacity 520ms ease",
                  }}
                >
                  <article
                    className={`relative size-full overflow-hidden bg-neutral-900 ${
                      isCenter
                        ? "shadow-[0_28px_80px_rgba(0,0,0,0.55)] ring-1 ring-white/25"
                        : "ring-1 ring-white/10"
                    }`}
                  >
                    {isCenter ? (
                      <Link
                        href={`/product/${product.slug}`}
                        className="absolute inset-0 z-[1]"
                        aria-label={product.name}
                        draggable={false}
                        onClick={(event) => {
                          if (suppressClickRef.current) event.preventDefault();
                        }}
                      />
                    ) : (
                      <button
                        type="button"
                        className="absolute inset-0 z-[1] cursor-grab active:cursor-grabbing"
                        aria-label={`Show ${product.name}`}
                        onClick={() => {
                          if (suppressClickRef.current) return;
                          goTo(index);
                        }}
                      />
                    )}

                    <LiveViewers slug={product.slug} className="absolute top-3 right-3 z-20" />
                    {product.isNew ? <NewBadge className="absolute top-3 left-3 z-20" /> : null}
                    <Image
                      src={product.image}
                      alt=""
                      fill
                      sizes="(min-width: 1280px) 30vw, (min-width: 640px) 40vw, 70vw"
                      className={`pointer-events-none object-cover transition duration-[1.1s] ease-out ${
                        isCenter && !reduceMotion ? "scale-105" : "scale-100"
                      }`}
                      draggable={false}
                      priority={abs < 1.2}
                    />
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
                    <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_35%,rgba(0,0,0,0.35)_100%)]" />

                    {isCenter ? (
                      <div className="absolute inset-x-0 bottom-0 z-10 p-4 sm:p-6 lg:p-7">
                        <p className="pointer-events-none text-[10px] tracking-[0.2em] text-white/55 uppercase">
                          {pad2(index + 1)} / {pad2(products.length)} · {offLabel}
                        </p>
                        <Link
                          href={`/product/${product.slug}`}
                          className="relative z-20 block"
                          draggable={false}
                          onClick={(event) => {
                            if (suppressClickRef.current) event.preventDefault();
                          }}
                        >
                          <h3 className="font-display mt-1.5 text-lg leading-tight tracking-tight sm:text-xl lg:text-2xl">
                            {product.name}
                          </h3>
                        </Link>
                        <p className="pointer-events-none mt-2 flex items-baseline gap-2">
                          <span className="font-display text-2xl tracking-tight text-white sm:text-3xl">
                            {formatPaisa(price)}
                          </span>
                          {price < product.pricePaisa ? (
                            <span className="text-sm text-white/45 line-through">
                              {formatPaisa(product.pricePaisa)}
                            </span>
                          ) : null}
                        </p>
                        <div className="pointer-events-none mt-3 scale-90 origin-left sm:scale-100">
                          <FlashCountdown
                            endsAt={
                              flashSaleItemForSlug(sale, product.slug)?.endsAt ?? sale.endsAt
                            }
                          />
                        </div>
                        <div className="relative z-20 mt-4 max-w-sm">
                          <ProductCardActions
                            slug={product.slug}
                            color={product.colors[0] ?? "Black"}
                            inStock={product.inStock}
                            tone="dark"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-3 sm:p-4">
                        <p className="truncate text-xs tracking-wide text-white/80">{product.name}</p>
                        <p className="mt-1 flex items-baseline gap-1.5 text-[11px]">
                          <span className="font-medium text-white">{formatPaisa(price)}</span>
                          {price < product.pricePaisa ? (
                            <span className="text-white/45 line-through">
                              {formatPaisa(product.pricePaisa)}
                            </span>
                          ) : null}
                        </p>
                      </div>
                    )}
                  </article>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="relative mx-auto flex max-w-7xl items-center justify-between gap-4 px-3 py-8 sm:px-6 sm:py-10">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => step(-1)}
              aria-label="Previous flash sale product"
              className="inline-flex size-11 items-center justify-center border border-white/25 text-white transition hover:bg-white hover:text-black sm:size-12"
            >
              <ChevronLeft className="size-5" strokeWidth={1.75} />
            </button>
            <button
              type="button"
              onClick={() => step(1)}
              aria-label="Next flash sale product"
              className="inline-flex size-11 items-center justify-center border border-white/25 text-white transition hover:bg-white hover:text-black sm:size-12"
            >
              <ChevronRight className="size-5" strokeWidth={1.75} />
            </button>
          </div>

          <div className="flex flex-1 items-center justify-center gap-1.5 sm:gap-2">
            {products.map((product, index) => (
              <button
                key={product.slug}
                type="button"
                aria-label={`Show ${product.name}`}
                onClick={() => goTo(index)}
                className={`h-1 rounded-full transition-all duration-500 ${
                  index === active
                    ? "w-8 bg-white sm:w-10"
                    : "w-2.5 bg-white/25 hover:bg-white/50"
                }`}
              />
            ))}
          </div>

          <p className="hidden min-w-[4.5rem] text-right text-xs tracking-[0.18em] text-white/45 uppercase sm:block">
            {pad2(active + 1)} / {pad2(products.length)}
          </p>
        </div>
      </div>

      <style>{`
        .flash-stage {
          --flash-card-w: 16.5rem;
          --flash-card-h: 22rem;
        }
        @media (min-width: 640px) {
          .flash-stage {
            --flash-card-w: 20rem;
            --flash-card-h: 27rem;
          }
        }
        @media (min-width: 1024px) {
          .flash-stage {
            --flash-card-w: 24rem;
            --flash-card-h: 32rem;
          }
        }
        @media (min-width: 1280px) {
          .flash-stage {
            --flash-card-w: 26rem;
            --flash-card-h: 34rem;
          }
        }
      `}</style>
    </section>
  );
}
