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
      <div className="absolute inset-0 bg-gradient-to-b from-black/75 via-black/25 to-black/85" />

      <div className="relative mx-auto flex min-h-[100svh] max-w-7xl flex-col justify-end px-4 pt-28 pb-20 sm:px-6 sm:pb-24">
        <p className="text-xs tracking-[0.32em] uppercase">{BRAND.name}</p>
        <h1 className="font-display mt-3 max-w-3xl text-5xl leading-[0.9] tracking-tight sm:text-7xl">
          {slide.title}
        </h1>
        <div className="mt-7 flex flex-wrap gap-3">
          <Link
            href={slide.href}
            className="inline-flex h-12 items-center bg-white px-5 text-sm font-medium text-black"
          >
            {slide.cta}
          </Link>
          <a
            href={BRAND.whatsappUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-12 items-center border border-white/70 px-5 text-sm text-white"
          >
            WhatsApp
          </a>
        </div>

        <div className="mt-8 flex items-center gap-2" role="tablist" aria-label="Hero slides">
          {slides.map((item, slideIndex) => (
            <button
              key={item.src}
              type="button"
              role="tab"
              aria-selected={slideIndex === index}
              aria-label={`Slide ${slideIndex + 1}`}
              onClick={() => setIndex(slideIndex)}
              className={`h-1.5 rounded-full transition-all ${
                slideIndex === index ? "w-8 bg-white" : "w-3 bg-white/40 hover:bg-white/70"
              }`}
            />
          ))}
        </div>
      </div>

      <div className="absolute inset-x-0 bottom-0 overflow-hidden border-t border-white/15 bg-black/70">
        <p className="sr-only">Categories</p>
        <div className="bl-marquee flex gap-10 py-3 text-[11px] tracking-[0.22em] uppercase">
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
            animation: bl-marquee 24s linear infinite;
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
