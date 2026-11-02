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

const AUTO_MS = 2600;

/** Cover-flow rail: center card larger, sides smaller, continuous auto-slide. */
export function FeaturedCategoryRail({ items }: Props) {
  const trackRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{
    pointerId: number;
    startX: number;
    origin: number;
    moved: boolean;
  } | null>(null);
  const suppressClickRef = useRef(false);

  const [active, setActive] = useState(() => Math.floor(items.length / 2));
  const [dragOffset, setDragOffset] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [spacing, setSpacing] = useState(128);

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
    if (dragging || items.length < 2) return;
    const timer = window.setInterval(() => {
      if (document.hidden) return;
      setActive((value) => (value + 1) % items.length);
    }, AUTO_MS);
    return () => window.clearInterval(timer);
  }, [dragging, items.length]);

  const goTo = (index: number) => setActive(index);

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
    setActive(next);
    setDragOffset(0);
  };

  const visualActive = active - dragOffset / spacing;

  return (
    <div className="featured-rail-scope relative isolate">
      <div
        ref={trackRef}
        className="relative mx-auto h-[17rem] touch-pan-y select-none overflow-hidden sm:h-[20rem] lg:h-[22rem]"
        style={{ perspective: reduceMotion ? undefined : "1100px" }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        role="listbox"
        aria-label="Featured categories"
        aria-activedescendant={items[active] ? `featured-cat-${items[active].slug}` : undefined}
        tabIndex={0}
      >
        <div className="pointer-events-none absolute inset-y-0 left-0 z-20 w-10 bg-gradient-to-r from-white to-transparent sm:w-16" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-20 w-10 bg-gradient-to-l from-white to-transparent sm:w-16" />

        <ul className="absolute inset-0 flex items-center justify-center">
          {items.map((item, index) => {
            const offset = shortestOffset(index - visualActive, items.length);
            const abs = Math.abs(offset);
            const yaw = reduceMotion ? 0 : clamp(offset * -14, -32, 32);
            // Center card clearly larger; sides step down.
            const scale = clamp(1.18 - abs * 0.14, 0.7, 1.18);
            const x = offset * spacing;
            const z = reduceMotion ? 0 : clamp(70 - abs * 42, -24, 90);
            const opacity = clamp(1.1 - abs * 0.18, 0.35, 1);
            const zIndex = Math.round(160 - abs * 16);
            const isCenter = abs < 0.5;

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
                  transform: `translate3d(${x}px, 0, ${z}px) rotateY(${yaw}deg) scale(${scale})`,
                  transformStyle: "preserve-3d",
                  zIndex,
                  opacity,
                  transition: dragging
                    ? "none"
                    : reduceMotion
                      ? "transform 240ms ease, opacity 240ms ease"
                      : "transform 700ms cubic-bezier(0.22, 1, 0.36, 1), opacity 480ms ease",
                }}
              >
                <Link
                  href={`/category/${item.slug}`}
                  className={`group relative block size-full overflow-hidden rounded-2xl bg-neutral-200 shadow-[0_14px_32px_rgba(0,0,0,0.18)] ring-1 ${
                    isCenter ? "ring-black/30" : "ring-black/10"
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
                >
                  {item.image.startsWith("/") || /\.r2\.dev|r2\.cloudflarestorage\.com/i.test(item.image) ? (
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      sizes="(min-width: 1024px) 240px, 180px"
                      className="object-cover transition duration-700 ease-out group-hover:scale-[1.03]"
                      draggable={false}
                      priority={abs < 1.5}
                    />
                  ) : (
                    <img
                      src={item.image}
                      alt={item.name}
                      className="absolute inset-0 size-full object-cover transition duration-700 ease-out group-hover:scale-[1.03]"
                      draggable={false}
                    />
                  )}
                  <span className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />
                  {isCenter ? (
                    <span className="absolute inset-x-0 bottom-0 flex justify-center p-2.5 sm:p-3">
                      <span className="bg-black px-3 py-1.5 text-[10px] font-medium tracking-[0.14em] text-white uppercase sm:text-[11px]">
                        {item.name}
                      </span>
                    </span>
                  ) : (
                    <span className="sr-only">{item.name}</span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="mt-3 flex items-center justify-center gap-1 sm:mt-4">
        {items.map((item, index) => (
          <button
            key={item.slug}
            type="button"
            aria-label={`Show ${item.name}`}
            onClick={() => goTo(index)}
            className={`h-1 rounded-full transition-all duration-500 ${
              index === active ? "w-5 bg-foreground" : "w-1.5 bg-foreground/25 hover:bg-foreground/45"
            }`}
          />
        ))}
      </div>

      <style>{`
        .featured-rail-scope {
          --featured-card-w: 8.25rem;
          --featured-card-h: 11.75rem;
        }
        @media (min-width: 640px) {
          .featured-rail-scope {
            --featured-card-w: 10rem;
            --featured-card-h: 14.25rem;
          }
        }
        @media (min-width: 1024px) {
          .featured-rail-scope {
            --featured-card-w: 11.5rem;
            --featured-card-h: 16.25rem;
          }
        }
      `}</style>
    </div>
  );
}

function shortestOffset(raw: number, length: number) {
  let value = raw;
  const half = length / 2;
  while (value > half) value -= length;
  while (value < -half) value += length;
  return value;
}

function cardSpacing() {
  if (typeof window === "undefined") return 128;
  if (window.matchMedia("(min-width: 1024px)").matches) return 168;
  if (window.matchMedia("(min-width: 640px)").matches) return 148;
  return 118;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}
