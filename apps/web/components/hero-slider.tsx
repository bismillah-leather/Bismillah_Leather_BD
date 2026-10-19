"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

const slides = [
  { src: "/catalog/hero-leather.jpg", focus: "object-[center_40%]" },
  { src: "/catalog/wallet-black-long.jpg", focus: "object-center" },
  { src: "/catalog/belt-black-formal.jpg", focus: "object-center" },
  { src: "/catalog/wallet-buffalo.jpg", focus: "object-center" },
] as const;

/** Full-bleed hero media only. Brand + search live in the site header overlay. */
export function HeroSlider() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setIndex((value) => (value + 1) % slides.length);
    }, 5500);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <section
      id="site-hero"
      aria-label="Featured leather"
      className="relative h-[100svh] min-h-[28rem] overflow-hidden bg-black"
    >
      {slides.map((item, slideIndex) => (
        <div
          key={item.src}
          className={`absolute inset-0 transition-opacity duration-[1.4s] ease-out ${
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
            className={`scale-[1.03] object-cover ${item.focus}`}
          />
        </div>
      ))}
    </section>
  );
}
