"use client";

import { BRAND, INITIAL_CATEGORIES } from "@bismillah/shared";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

const slides = [
  {
    src: "/catalog/hero-leather.jpg",
    title: "Men's leather, every day.",
    href: "/category/long-wallet",
    cta: "Shop wallets",
    focus: "object-[center_40%]",
  },
  {
    src: "/catalog/wallet-black-long.jpg",
    title: "Long wallets that last.",
    href: "/category/long-wallet",
    cta: "Shop long",
    focus: "object-center",
  },
  {
    src: "/catalog/belt-black-formal.jpg",
    title: "Belts cut for dress.",
    href: "/category/formal-belt",
    cta: "Shop belts",
    focus: "object-center",
  },
  {
    src: "/catalog/wallet-black-short.jpg",
    title: "RFID trifold protect.",
    href: "/category/trifold-wallet",
    cta: "Shop trifold",
    focus: "object-center",
  },
  {
    src: "/catalog/wallet-buffalo.jpg",
    title: "Buffalo hide, heavy edge.",
    href: "/category/buffalo-wallet",
    cta: "Shop buffalo",
    focus: "object-center",
  },
] as const;

const ticker = [
  ...INITIAL_CATEGORIES.map((category) => category.name),
  ...INITIAL_CATEGORIES.map((category) => category.name),
];

export function HeroSlider() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setIndex((value) => (value + 1) % slides.length);
    }, 4500);
    return () => window.clearInterval(timer);
  }, []);

  const slide = slides[index] ?? slides[0]!;

  return (
    <section className="relative min-h-[100svh] overflow-hidden bg-black text-white">
      {slides.map((item, slideIndex) => (
        <div
          key={item.src}
          className={`absolute inset-0 transition-opacity duration-1000 ease-out ${
            slideIndex === index ? "opacity-100" : "opacity-0"
          }`}
          aria-hidden={slideIndex !== index}
        >
          <Image
            src={item.src}
            alt=""
            fill
            priority={slideIndex === 0}
            sizes="100vw"
            className={`scale-105 object-cover ${item.focus}`}
          />
        </div>
      ))}
      <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/30 to-black/90" />

      <div className="relative mx-auto flex min-h-[100svh] max-w-7xl flex-col justify-end px-4 pt-32 pb-24 sm:px-6 sm:pt-36 sm:pb-28">
        <p className="text-[10px] tracking-[0.28em] uppercase sm:text-xs sm:tracking-[0.32em]">
          {BRAND.name}
        </p>
        <h1 className="font-display mt-2 max-w-3xl text-[2.35rem] leading-[0.95] tracking-tight sm:mt-3 sm:text-6xl lg:text-7xl">
          {slide.title}
        </h1>
        <div className="mt-5 flex flex-wrap gap-2 sm:mt-7 sm:gap-3">
          <Link
            href={slide.href}
            className="inline-flex h-11 items-center bg-white px-4 text-sm font-medium text-black sm:h-12 sm:px-5"
          >
            {slide.cta}
          </Link>
          <a
            href={BRAND.whatsappUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-11 items-center border border-white/70 px-4 text-sm text-white sm:h-12 sm:px-5"
          >
            WhatsApp
          </a>
        </div>

        <div className="mt-6 flex items-center gap-2 sm:mt-8" role="tablist" aria-label="Hero slides">
          {slides.map((item, slideIndex) => (
            <button
              key={item.src}
              type="button"
              role="tab"
              aria-selected={slideIndex === index}
              aria-label={`Slide ${slideIndex + 1}`}
              onClick={() => setIndex(slideIndex)}
              className={`h-1.5 rounded-full transition-all ${
                slideIndex === index ? "w-7 bg-white sm:w-8" : "w-2.5 bg-white/40 hover:bg-white/70 sm:w-3"
              }`}
            />
          ))}
        </div>
      </div>

      <div className="absolute inset-x-0 bottom-0 overflow-hidden border-t border-white/15 bg-black/80 pb-[env(safe-area-inset-bottom,0px)]">
        <p className="sr-only">Categories</p>
        <div className="bl-marquee flex gap-6 py-2.5 text-[10px] tracking-[0.18em] uppercase sm:gap-10 sm:py-3 sm:text-[11px] sm:tracking-[0.22em]">
          {ticker.map((name, i) => (
            <span key={`${name}-${i}`} className="shrink-0 text-white/90">
              {name}
            </span>
          ))}
        </div>
        <style>{`
          @keyframes bl-marquee {
            from { transform: translateX(0); }
            to { transform: translateX(-50%); }
          }
          .bl-marquee {
            width: max-content;
            animation: bl-marquee 22s linear infinite;
            will-change: transform;
          }
          @media (prefers-reduced-motion: reduce) {
            .bl-marquee { animation: none; }
          }
        `}</style>
      </div>
    </section>
  );
}
