"use client";

import { BRAND } from "@bismillah/shared";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

const slides = [
  {
    src: "/catalog/hero-leather.jpg",
    title: "Men's leather, every day.",
    href: "/category/long-wallet",
    cta: "Shop wallets",
  },
  {
    src: "/catalog/wallet-black-long.jpg",
    title: "Long wallets that last.",
    href: "/category/long-wallet",
    cta: "Shop long",
  },
  {
    src: "/catalog/belt-black-formal.jpg",
    title: "Belts cut for dress.",
    href: "/category/formal-belt",
    cta: "Shop belts",
  },
  {
    src: "/catalog/wallet-black-short.jpg",
    title: "RFID trifold protect.",
    href: "/category/trifold-wallet",
    cta: "Shop trifold",
  },
  {
    src: "/catalog/wallet-cognac-mini.jpg",
    title: "Mini carry, full leather.",
    href: "/category/mini-wallet",
    cta: "Shop mini",
  },
] as const;

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
    <section className="relative min-h-[72vh] overflow-hidden bg-black text-white sm:min-h-[88vh]">
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
            className="object-cover"
          />
        </div>
      ))}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-black/35" />

      <div className="relative mx-auto flex min-h-[72vh] max-w-7xl flex-col justify-end px-4 pt-16 pb-12 sm:min-h-[88vh] sm:px-6 sm:pb-16">
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
    </section>
  );
}
