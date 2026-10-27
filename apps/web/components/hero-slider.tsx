"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useStoreBrand } from "./brand-provider";

const slides = [
  { src: "/catalog/hero-leather.jpg", focus: "object-[center_38%]" },
  { src: "/catalog/wallet-black-long.jpg", focus: "object-center" },
  { src: "/catalog/wallet-buffalo.jpg", focus: "object-[center_35%]" },
  { src: "/catalog/belt-black-formal.jpg", focus: "object-center" },
] as const;

const INTERVAL_MS = 6000;

/** Balanced banner height; brand copy stays compact. */
export function HeroSlider() {
  const brand = useStoreBrand();
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setIndex((value) => (value + 1) % slides.length);
    }, INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <section
      id="site-hero"
      aria-label="Bismillah Leather"
      className="relative h-[min(48svh,22rem)] overflow-hidden bg-black text-white sm:h-[min(52svh,26rem)] md:h-[min(56svh,30rem)]"
    >
      {slides.map((item, slideIndex) => {
        const active = slideIndex === index;
        return (
          <div
            key={item.src}
            className={`absolute inset-0 transition-opacity duration-[1600ms] ease-out ${
              active ? "opacity-100" : "opacity-0"
            }`}
            aria-hidden={!active}
          >
            <Image
              src={item.src}
              alt=""
              fill
              priority={slideIndex === 0}
              sizes="100vw"
              className={`object-cover ${item.focus} ${
                active ? "hero-kenburns" : "scale-[1.02]"
              }`}
            />
          </div>
        );
      })}

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/45 via-transparent to-black/70"
      />

      <div className="relative z-10 flex h-full flex-col items-center justify-end px-4 pb-5 text-center sm:pb-6 md:pb-7">
        <h1 className="font-display max-w-3xl text-2xl leading-[0.95] tracking-tight drop-shadow-[0_2px_18px_rgba(0,0,0,0.45)] sm:text-3xl md:text-4xl lg:text-5xl">
          {brand.name}
        </h1>
        <p className="mt-2 max-w-md text-[10px] leading-snug tracking-wide text-white/75 uppercase sm:text-xs">
          {brand.tagline}
        </p>

        <div className="mt-3 flex items-center gap-1.5" role="tablist" aria-label="Hero slides">
          {slides.map((item, slideIndex) => (
            <button
              key={item.src}
              type="button"
              role="tab"
              aria-selected={slideIndex === index}
              aria-label={`Slide ${slideIndex + 1}`}
              onClick={() => setIndex(slideIndex)}
              className={`h-0.5 rounded-full transition-all duration-500 ${
                slideIndex === index
                  ? "w-4 bg-white sm:w-5"
                  : "w-1.5 bg-white/40 hover:bg-white/70"
              }`}
            />
          ))}
        </div>
      </div>

      <style>{`
        @keyframes hero-kenburns {
          from { transform: scale(1.02); }
          to { transform: scale(1.06); }
        }
        .hero-kenburns {
          animation: hero-kenburns ${INTERVAL_MS}ms linear forwards;
          will-change: transform;
        }
        @media (prefers-reduced-motion: reduce) {
          .hero-kenburns { animation: none; transform: scale(1.02); }
        }
      `}</style>
    </section>
  );
}
