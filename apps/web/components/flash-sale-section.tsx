"use client";

import {
  flashSaleCountdown,
  flashSalePricePaisa,
  flashSaleProducts,
  formatPaisa,
  isFlashSaleLive,
  type FlashSaleConfig,
} from "@bismillah/shared";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ProductCardActions } from "./product-card-actions";

function pad2(n: number) {
  return n.toString().padStart(2, "0");
}

function CountdownDigit({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative overflow-hidden bg-white text-black shadow-[0_1px_0_rgba(255,255,255,0.12)]">
        <span
          key={value}
          className="font-display block min-w-[2.75rem] px-2.5 py-2 text-center text-2xl leading-none tracking-tight tabular-nums sm:min-w-[3.25rem] sm:px-3 sm:py-2.5 sm:text-3xl animate-[flash-tick_0.35s_ease-out]"
        >
          {value}
        </span>
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-1/2 h-px bg-black/10"
        />
      </div>
      <span className="text-[10px] tracking-[0.2em] text-white/55 uppercase">{label}</span>
    </div>
  );
}

function FlashCountdown({ endsAt }: { endsAt: string }) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const parts = flashSaleCountdown(endsAt, new Date(now));

  if (parts.expired) {
    return (
      <p className="text-sm tracking-[0.12em] text-white/70 uppercase">Sale ended</p>
    );
  }

  const hours = parts.hours;
  const showDays = hours >= 24;
  const days = Math.floor(hours / 24);
  const remHours = hours % 24;

  return (
    <div className="flex flex-wrap items-end gap-2 sm:gap-3" aria-live="polite">
      {showDays ? (
        <>
          <CountdownDigit value={pad2(days)} label="Days" />
          <span className="mb-6 text-xl text-white/40">:</span>
        </>
      ) : null}
      <CountdownDigit value={pad2(showDays ? remHours : hours)} label="Hrs" />
      <span className="mb-6 text-xl text-white/40">:</span>
      <CountdownDigit value={pad2(parts.minutes)} label="Min" />
      <span className="mb-6 text-xl text-white/40">:</span>
      <CountdownDigit value={pad2(parts.seconds)} label="Sec" />
    </div>
  );
}

function discountLabel(sale: FlashSaleConfig) {
  if (sale.discountKind === "percent") {
    const pct = Number(sale.discountValue) / 100;
    return `${pct % 1 === 0 ? pct.toFixed(0) : pct.toFixed(1)}% OFF`;
  }
  const taka = Number(sale.discountValue) / 100;
  return `৳${taka.toLocaleString("en-BD")} OFF`;
}

export function FlashSaleSection({ sale: initialSale }: { sale: FlashSaleConfig }) {
  const [sale, setSale] = useState(initialSale);

  useEffect(() => {
    setSale(initialSale);
  }, [initialSale]);

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

  const live = isFlashSaleLive(sale);
  const products = useMemo(() => flashSaleProducts(sale), [sale]);

  if (!sale.isActive || !live || products.length === 0) {
    return null;
  }

  return (
    <section className="relative overflow-hidden border-y border-white/10 bg-black text-white">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 20%, #fff 0.6px, transparent 0.7px), radial-gradient(circle at 80% 60%, #fff 0.6px, transparent 0.7px)",
          backgroundSize: "28px 28px, 36px 36px",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 right-0 h-64 w-64 rounded-full bg-white/10 blur-3xl"
      />

      <div className="relative mx-auto max-w-7xl px-3 py-12 sm:px-6 sm:py-20">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-xl">
            <p className="inline-flex items-center gap-2 text-xs tracking-[0.28em] text-white/55 uppercase">
              <span className="relative flex size-2">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-white opacity-40" />
                <span className="relative inline-flex size-2 rounded-full bg-white" />
              </span>
              Ends soon
            </p>
            <h2 className="font-display mt-3 text-4xl tracking-tight sm:text-6xl md:text-7xl">
              {sale.title}
            </h2>
            <p className="mt-3 max-w-md text-sm leading-6 text-white/70">{sale.subtitle}</p>
            <p className="mt-4 inline-flex bg-white px-3 py-1.5 text-xs font-medium tracking-[0.14em] text-black uppercase">
              {discountLabel(sale)}
            </p>
          </div>

          <div>
            <p className="mb-3 text-[10px] tracking-[0.22em] text-white/45 uppercase">
              Time remaining
            </p>
            <FlashCountdown endsAt={sale.endsAt} />
          </div>
        </div>

        <ul className="mt-10 grid grid-cols-2 gap-3 sm:mt-14 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">
          {products.map((product) => {
            const list = product.pricePaisa;
            const salePrice = flashSalePricePaisa(list, sale);
            const color = product.colors[0] ?? "Black";

            return (
              <li key={product.slug} className="group flex flex-col bg-white text-black">
                <Link
                  href={`/product/${product.slug}`}
                  className="relative block aspect-[3/4] overflow-hidden bg-neutral-100"
                >
                  <Image
                    src={product.image}
                    alt={product.name}
                    fill
                    sizes="(min-width: 1280px) 22vw, (min-width: 1024px) 30vw, 50vw"
                    className="object-cover transition duration-500 group-hover:scale-105"
                  />
                  <span className="absolute top-2.5 left-2.5 bg-black px-2 py-1 text-[10px] tracking-[0.12em] text-white uppercase">
                    Flash
                  </span>
                </Link>
                <div className="flex flex-1 flex-col p-3 sm:p-4">
                  <Link href={`/product/${product.slug}`}>
                    <h3 className="text-sm leading-snug sm:text-[15px]">{product.name}</h3>
                  </Link>
                  <p className="mt-2 text-sm">
                    <span className="font-medium">{formatPaisa(salePrice)}</span>
                    <span className="ml-2 text-neutral-400 line-through">
                      {formatPaisa(list)}
                    </span>
                  </p>
                  <div className="mt-auto pt-3">
                    <ProductCardActions
                      slug={product.slug}
                      color={color}
                      inStock={product.inStock}
                      compact
                    />
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
