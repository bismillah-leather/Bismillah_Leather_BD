"use client";

import { formatPaisa, galleryFor, type ShowcaseProduct } from "@bismillah/shared";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { LiveViewers } from "./live-viewers";
import { NewBadge } from "./new-badge";
import { ProductCardActions } from "./product-card-actions";

function pickBestSellers(catalog: ShowcaseProduct[]): ShowcaseProduct[] {
  const onSale = catalog.filter((product) => product.salePaisa);
  const rest = catalog.filter((product) => !product.salePaisa);
  const merged = [...onSale, ...rest];
  const seen = new Set<string>();
  return merged
    .filter((product) => {
      if (seen.has(product.slug)) return false;
      seen.add(product.slug);
      return true;
    })
    .slice(0, 8);
}

const ROTATE_MS = 4200;

export function BestSellersSection({ products }: { products: ShowcaseProduct[] }) {
  const best = useMemo(() => pickBestSellers(products), [products]);
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const featured = best[active] ?? best[0];
  const faces = useMemo(
    () => (featured ? [...new Set(galleryFor(featured))].slice(0, 4) : []),
    [featured],
  );
  const [face, setFace] = useState(0);

  useEffect(() => {
    if (paused || best.length < 2) return;
    const timer = window.setInterval(() => {
      setActive((value) => (value + 1) % best.length);
      setFace(0);
    }, ROTATE_MS);
    return () => window.clearInterval(timer);
  }, [paused, best.length]);

  useEffect(() => {
    if (paused || faces.length < 2) return;
    const timer = window.setInterval(() => {
      setFace((value) => (value + 1) % faces.length);
    }, 1200);
    return () => window.clearInterval(timer);
  }, [faces.length, featured?.slug, paused]);

  if (!featured) return null;

  return (
    <section className="bg-black py-10 text-white sm:py-14">
      <div className="mx-auto max-w-7xl px-3 sm:px-6">
        <div className="mb-6 flex flex-col gap-3 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[10px] tracking-[0.28em] text-white/50 uppercase sm:text-[11px]">
              Most loved
            </p>
            <h2 className="font-display mt-1.5 text-2xl tracking-tight sm:text-3xl md:text-4xl">
              Best sellers
            </h2>
          </div>
          <Link
            href="/search?q=sale"
            className="inline-flex h-9 items-center border border-white/40 px-3.5 text-xs transition hover:bg-white hover:text-black sm:text-sm"
          >
            View sale
          </Link>
        </div>

        <div
          className="grid gap-4 lg:grid-cols-[1.3fr_0.9fr] lg:gap-5"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          <div className="relative min-h-[18rem] overflow-hidden bg-neutral-900 sm:min-h-[22rem] md:min-h-[26rem]">
            {faces.map((src, faceIndex) => (
              <Image
                key={`${featured.slug}-${src}-${faceIndex}`}
                src={src}
                alt={featured.name}
                fill
                sizes="(min-width: 1024px) 55vw, 100vw"
                className={`object-cover transition duration-500 ${
                  faceIndex === face ? "opacity-100" : "opacity-0"
                }`}
                priority={active === 0}
              />
            ))}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />

            <div className="absolute top-4 left-4 flex gap-2">
              <span className="bg-white px-2.5 py-1 text-xs font-medium tracking-wide text-black">
                #{active + 1}
              </span>
              {featured.isNew ? <NewBadge /> : null}
              {featured.salePaisa ? (
                <span className="border border-white/40 px-2.5 py-1 text-xs tracking-wide text-white">
                  Sale
                </span>
              ) : null}
            </div>

            <LiveViewers slug={featured.slug} className="absolute top-4 right-4 z-10" />
            <div className="absolute top-14 right-4 flex gap-1">
              {best.map((product, index) => (
                <button
                  key={product.slug}
                  type="button"
                  aria-label={product.name}
                  onClick={() => {
                    setActive(index);
                    setFace(0);
                  }}
                  className={`h-1 w-6 ${index === active ? "bg-white" : "bg-white/30"}`}
                />
              ))}
            </div>

            <div className="absolute inset-x-0 bottom-0 p-5 sm:p-7">
              <p className="text-[11px] tracking-[0.16em] text-white/60 uppercase">
                {featured.colors.join(" · ")}
              </p>
              <Link href={`/product/${featured.slug}`}>
                <h3 className="font-display mt-1.5 text-xl tracking-tight sm:text-2xl">{featured.name}</h3>
              </Link>
              <p className="mt-3 line-clamp-2 max-w-md text-sm text-white/70">{featured.blurb}</p>
              <p className="mt-3 text-lg">
                <span className="font-medium">
                  {formatPaisa(featured.salePaisa ?? featured.pricePaisa)}
                </span>
                {featured.salePaisa ? (
                  <span className="ml-2 text-sm text-white/40 line-through">
                    {formatPaisa(featured.pricePaisa)}
                  </span>
                ) : null}
              </p>
              <div className="mt-4 max-w-sm">
                <ProductCardActions
                  slug={featured.slug}
                  color={featured.colors[0] ?? "Black"}
                  inStock={featured.inStock}
                  tone="dark"
                />
              </div>
            </div>
          </div>

          <ul className="flex max-h-[32rem] flex-col gap-2 overflow-y-auto lg:max-h-none">
            {best.map((product, index) => {
              const selected = index === active;
              const price = product.salePaisa ?? product.pricePaisa;
              return (
                <li key={product.slug}>
                  <button
                    type="button"
                    onClick={() => {
                      setActive(index);
                      setFace(0);
                    }}
                    className={`flex w-full items-center gap-3 p-2.5 text-left transition sm:gap-3.5 sm:p-3 ${
                      selected
                        ? "bg-white text-black"
                        : "bg-white/5 text-white hover:bg-white/10"
                    }`}
                  >
                    <span
                      className={`flex size-9 shrink-0 items-center justify-center text-xs ${
                        selected ? "bg-black text-white" : "bg-white/10"
                      }`}
                    >
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="relative size-14 shrink-0 overflow-hidden bg-neutral-800 sm:size-16">
                      <Image src={product.image} alt="" fill sizes="64px" className="object-cover" />
                      <LiveViewers
                        slug={product.slug}
                        className="absolute top-1 right-1 z-10 px-1 py-0.5"
                      />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">{product.name}</span>
                      <span className={`mt-0.5 block text-xs ${selected ? "text-black/55" : "text-white/50"}`}>
                        {formatPaisa(price)}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        <ul className="mt-8 grid grid-cols-2 gap-3 sm:mt-10 sm:grid-cols-4 sm:gap-4">
          {best.slice(0, 4).map((product, index) => (
            <li key={`grid-${product.slug}`}>
              <BestGridCard product={product} rank={index + 1} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function BestGridCard({ product, rank }: { product: ShowcaseProduct; rank: number }) {
  const price = product.salePaisa ?? product.pricePaisa;
  const color = product.colors[0] ?? "Black";

  return (
    <article className="relative flex h-full flex-col border border-white/15 bg-white/5 p-2">
      <Link href={`/product/${product.slug}`} className="relative block aspect-[3/4] overflow-hidden bg-neutral-900">
        <Image
          src={product.image}
          alt={product.name}
          fill
          sizes="(min-width: 1024px) 22vw, 50vw"
          className="object-cover transition duration-500 hover:scale-105"
        />
        <span className="absolute top-2 left-2 flex flex-col items-start gap-1">
          <span className="bg-white px-2 py-0.5 text-[10px] font-medium text-black">#{rank}</span>
          {product.isNew ? <NewBadge /> : null}
        </span>
      </Link>
      <LiveViewers slug={product.slug} className="absolute top-4 right-4 z-10" />
      <div className="mt-3 flex flex-1 flex-col px-0.5">
        <Link href={`/product/${product.slug}`}>
          <h3 className="text-sm text-white">{product.name}</h3>
        </Link>
        <p className="mt-1 text-sm text-white/80">
          <span className="font-medium text-white">{formatPaisa(price)}</span>
          {product.salePaisa ? (
            <span className="ml-2 text-white/35 line-through">{formatPaisa(product.pricePaisa)}</span>
          ) : null}
        </p>
        <div className="mt-auto">
          <ProductCardActions
            slug={product.slug}
            color={color}
            inStock={product.inStock}
            compact
            tone="dark"
          />
        </div>
      </div>
    </article>
  );
}
