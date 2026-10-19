"use client";

import { BRAND } from "@bismillah/shared";
import Image from "next/image";
import { useEffect, useState } from "react";

const slides = [
  { src: "/catalog/hero-leather.jpg", focus: "object-[center_42%]" },
  { src: "/catalog/wallet-black-long.jpg", focus: "object-center" },
  { src: "/catalog/wallet-buffalo.jpg", focus: "object-[center_35%]" },
  { src: "/catalog/belt-black-formal.jpg", focus: "object-center" },
] as const;

const INTERVAL_MS = 6000;

/** Full-bleed cinematic hero. Brand wordmark lives here; search sits in the header. */
export function HeroSlider() {
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
      className="relative h-[100svh] min-h-[32rem] overflow-hidden bg-black text-white"
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
                active ? "hero-kenburns" : "scale-105"
              }`}
            />
          </div>
        );
      })}

      {/* Cinematic light — readability without covering the product */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/55 via-transparent to-black/75"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_35%,_rgba(0,0,0,0.45)_100%)]"
      />

      {/* Hero brand composition */}
      <div className="relative z-10 flex h-full flex-col items-center justify-end px-5 pb-16 text-center sm:pb-20 md:pb-24">
        <p className="text-[10px] tracking-[0.42em] text-white/70 uppercase sm:text-xs sm:tracking-[0.48em]">
          Genuine leather · Mirpur-10
        </p>
        <h1 className="font-display mt-4 max-w-4xl text-[2.75rem] leading-[0.92] tracking-tight drop-shadow-[0_2px_24px_rgba(0,0,0,0.45)] sm:text-6xl md:text-7xl lg:text-8xl">
          {BRAND.name}
        </h1>
        <p className="mt-4 max-w-md text-sm leading-relaxed text-white/80 sm:mt-5 sm:text-base">
          {BRAND.tagline}
        </p>

        <div className="mt-8 flex items-center gap-2" role="tablist" aria-label="Hero slides">
          {slides.map((item, slideIndex) => (
            <button
              key={item.src}
              type="button"
              role="tab"
              aria-selected={slideIndex === index}
              aria-label={`Slide ${slideIndex + 1}`}
              onClick={() => setIndex(slideIndex)}
              className={`h-1 rounded-full transition-all duration-500 ${
                slideIndex === index
                  ? "w-8 bg-white sm:w-10"
                  : "w-2.5 bg-white/40 hover:bg-white/70"
              }`}
            />
          ))}
        </div>

        <button
          type="button"
          className="mt-8 flex flex-col items-center gap-2 text-white/55 transition hover:text-white/90"
          onClick={() => {
            document.getElementById("site-hero")?.nextElementSibling?.scrollIntoView({
              behavior: "smooth",
            });
          }}
          aria-label="Scroll to shop"
        >
          <span className="text-[10px] tracking-[0.28em] uppercase">Scroll</span>
          <span className="hero-scroll-line block h-8 w-px bg-white/50" />
        </button>
      </div>

      <style>{`
        @keyframes hero-kenburns {
          from { transform: scale(1.06); }
          to { transform: scale(1.14); }
        }
        .hero-kenburns {
          animation: hero-kenburns ${INTERVAL_MS}ms linear forwards;
          will-change: transform;
        }
        @keyframes hero-scroll {
          0%, 100% { transform: scaleY(0.55); opacity: 0.35; transform-origin: top; }
          50% { transform: scaleY(1); opacity: 0.9; transform-origin: top; }
        }
        .hero-scroll-line {
          animation: hero-scroll 1.8s ease-in-out infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .hero-kenburns { animation: none; transform: scale(1.05); }
          .hero-scroll-line { animation: none; }
        }
      `}</style>
    </section>
  );
}
