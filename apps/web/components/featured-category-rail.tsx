"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";

export type FeaturedCategoryCard = {
  slug: string;
  name: string;
  image: string;
};

type Props = {
  items: readonly FeaturedCategoryCard[];
};

const AUTO_MS = 3200;

/**
 * Cover-flow rail: Urbaland fan + auto-slide.
 * Drag / wheel / keys still work. Hover pauses auto and faces the card toward you.
 */
export function FeaturedCategoryRail({ items }: Props) {
  const trackRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{
    pointerId: number;
    startX: number;
    origin: number;
    moved: boolean;
  } | null>(null);
  const suppressClickRef = useRef(false);
  const pauseUntilRef = useRef(0);

  const [active, setActive] = useState(() => Math.floor(items.length / 2));
  const [dragOffset, setDragOffset] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [hover, setHover] = useState<number | null>(null);
  const [paused, setPaused] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [spacing, setSpacing] = useState(160);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduceMotion(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    const measure = () => setSpacing(cardSpacing());
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA")) return;
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        bumpPause();
        setActive((value) => (value - 1 + items.length) % items.length);
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        bumpPause();
        setActive((value) => (value + 1) % items.length);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [items.length]);

  useEffect(() => {
    if (paused || dragging || items.length < 2) return;

    const timer = window.setInterval(() => {
      if (performance.now() < pauseUntilRef.current) return;
      if (document.hidden) return;
      setActive((value) => (value + 1) % items.length);
    }, AUTO_MS);

    return () => window.clearInterval(timer);
  }, [dragging, items.length, paused]);

  useEffect(() => {
    const node = trackRef.current;
    if (!node) return;

    let lastStep = 0;
    const onWheel = (event: WheelEvent) => {
      const dominant =
        Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
      if (Math.abs(dominant) < 10) return;
      event.preventDefault();
      const now = performance.now();
      if (now - lastStep < 280) return;
      lastStep = now;
      bumpPause();
      const delta = dominant > 0 ? 1 : -1;
      setActive((value) => (value + delta + items.length) % items.length);
    };

    node.addEventListener("wheel", onWheel, { passive: false });
    return () => node.removeEventListener("wheel", onWheel);
  }, [items.length]);

  const bumpPause = () => {
    pauseUntilRef.current = performance.now() + 4500;
  };

  const step = (delta: number) => {
    bumpPause();
    setActive((value) => (value + delta + items.length) % items.length);
  };

  const goTo = (index: number) => {
    bumpPause();
    setActive(index);
  };

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;
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
    if (Math.abs(delta) > 6) drag.moved = true;
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
    const next = ((drag.origin + shift) % items.length + items.length) % items.length;
    dragRef.current = null;
    setDragging(false);
    bumpPause();
    setActive(next);
    setDragOffset(0);
  };

  const visualActive = active - dragOffset / spacing;

  return (
    <div
      className="featured-rail-scope relative"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <p className="sr-only">
        Cards auto-advance. Scroll or drag to move them. Left and right arrow keys also move them.
        Hover pauses auto-play and turns a card toward you.
      </p>

      <div
        ref={trackRef}
        className="relative mx-auto h-[26rem] touch-pan-y select-none overflow-hidden sm:h-[32rem] lg:h-[36rem]"
        style={{ perspective: reduceMotion ? undefined : "1400px" }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        role="listbox"
        aria-label="Featured categories"
        aria-activedescendant={items[active] ? `featured-cat-${items[active].slug}` : undefined}
        tabIndex={0}
      >
        <div className="pointer-events-none absolute inset-y-0 left-0 z-20 w-12 bg-gradient-to-r from-secondary to-transparent sm:w-20" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-20 w-12 bg-gradient-to-l from-secondary to-transparent sm:w-20" />

        <ul className="absolute inset-0 flex items-center justify-center">
          {items.map((item, index) => {
            const offset = shortestOffset(index - visualActive, items.length);
            const abs = Math.abs(offset);
            const facing = hover === index;
            const yaw = reduceMotion ? 0 : facing ? 0 : clamp(offset * -22, -52, 52);
            const tilt = reduceMotion || facing ? 0 : clamp(abs * 2.2, 0, 8);
            const scale = clamp(1.12 - abs * 0.13, 0.66, 1.16);
            const x = offset * spacing * (reduceMotion ? 1 : 0.9);
            const y = reduceMotion ? 0 : abs * abs * 4;
            const z = reduceMotion ? 0 : clamp(110 - abs * 60, -50, 130);
            const opacity = clamp(1.25 - abs * 0.17, 0.38, 1);
            const zIndex = Math.round(140 - abs * 14);
            const isCenter = abs < 0.45;

            return (
              <li
                key={item.slug}
                id={`featured-cat-${item.slug}`}
                role="option"
                aria-selected={index === active}
                className="absolute"
                style={{
                  width: "var(--featured-card-w)",
                  height: "var(--featured-card-h)",
                  transform: `translate3d(${x}px, ${y}px, ${z}px) rotateY(${yaw}deg) rotateX(${tilt}deg) scale(${scale})`,
                  transformStyle: "preserve-3d",
                  zIndex,
                  opacity,
                  transition: dragging
                    ? "none"
                    : reduceMotion
                      ? "transform 220ms ease, opacity 220ms ease"
                      : "transform 680ms cubic-bezier(0.16, 1, 0.3, 1), opacity 480ms ease",
                }}
                onMouseEnter={() => setHover(index)}
                onMouseLeave={() => setHover((value) => (value === index ? null : value))}
              >
                <Link
                  href={`/category/${item.slug}`}
                  className={`group relative block size-full overflow-hidden rounded-2xl bg-secondary shadow-[0_16px_36px_rgba(0,0,0,0.18)] ring-1 ring-black/10 ${
                    isCenter ? "ring-black/25" : ""
                  }`}
                  draggable={false}
                  onClick={(event) => {
                    if (suppressClickRef.current) {
                      event.preventDefault();
                      return;
                    }
                    if (index !== active) {
                      event.preventDefault();
                      goTo(index);
                    }
                  }}
                  onFocus={() => {
                    setHover(index);
                    goTo(index);
                    setPaused(true);
                  }}
                  onBlur={() => {
                    setHover((value) => (value === index ? null : value));
                    setPaused(false);
                  }}
                >
                  <Image
                    src={item.image}
                    alt=""
                    fill
                    sizes="(min-width: 1024px) 280px, 200px"
                    className="object-cover transition duration-700 ease-out group-hover:scale-[1.05]"
                    draggable={false}
                    priority={abs < 1.5}
                  />
                  <span className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/5" />
                  <span className="absolute inset-x-0 bottom-0 flex justify-center p-3.5 sm:p-5">
                    <span className="bg-black px-3.5 py-2 text-xs font-medium tracking-[0.16em] text-white uppercase sm:px-4 sm:py-2.5 sm:text-sm">
                      {item.name}
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="mt-6 flex items-center justify-center gap-3 sm:mt-8 sm:gap-4">
        <button
          type="button"
          className="inline-flex h-11 items-center border border-border bg-white px-5 text-sm hover:bg-white/80 sm:h-12 sm:px-6"
          onClick={() => step(-1)}
          aria-label="Previous category"
        >
          Prev
        </button>
        <div className="flex items-center gap-1.5 sm:gap-2">
          {items.map((item, index) => (
            <button
              key={item.slug}
              type="button"
              aria-label={`Show ${item.name}`}
              onClick={() => goTo(index)}
              className={`h-1.5 rounded-full transition-all duration-500 ${
                index === active
                  ? "w-7 bg-foreground sm:w-8"
                  : "w-2.5 bg-foreground/25 hover:bg-foreground/50"
              }`}
            />
          ))}
        </div>
        <button
          type="button"
          className="inline-flex h-11 items-center border border-border bg-white px-5 text-sm hover:bg-white/80 sm:h-12 sm:px-6"
          onClick={() => step(1)}
          aria-label="Next category"
        >
          Next
        </button>
      </div>

      <style>{`
        .featured-rail-scope {
          --featured-card-w: 11.5rem;
          --featured-card-h: 16.5rem;
        }
        @media (min-width: 640px) {
          .featured-rail-scope {
            --featured-card-w: 14.5rem;
            --featured-card-h: 21rem;
          }
        }
        @media (min-width: 1024px) {
          .featured-rail-scope {
            --featured-card-w: 17rem;
            --featured-card-h: 24.5rem;
          }
        }
      `}</style>
    </div>
  );
}

/** Prefer the short path around a looping carousel for layout math. */
function shortestOffset(raw: number, length: number) {
  let value = raw;
  const half = length / 2;
  while (value > half) value -= length;
  while (value < -half) value += length;
  return value;
}

function cardSpacing() {
  if (typeof window === "undefined") return 150;
  if (window.matchMedia("(min-width: 1024px)").matches) return 178;
  if (window.matchMedia("(min-width: 640px)").matches) return 150;
  return 118;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}
