"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type MouseEvent } from "react";
import { LiveViewers } from "./live-viewers";
import { NewBadge } from "./new-badge";

export function ProductGallery({
  images,
  alt,
  slug,
  isNew = false,
}: {
  images: readonly string[];
  alt: string;
  slug?: string;
  isNew?: boolean;
}) {
  const shots = images.length > 0 ? images : ["/catalog/wallet-black-long.jpg"];
  const [active, setActive] = useState(0);
  const [zooming, setZooming] = useState(false);
  const [origin, setOrigin] = useState("50% 50%");
  const stageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setActive(0);
    setZooming(false);
  }, [shots.join("|")]);

  const onMove = (event: MouseEvent<HTMLDivElement>) => {
    const node = stageRef.current;
    if (!node) return;
    const rect = node.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    setOrigin(`${Math.min(100, Math.max(0, x))}% ${Math.min(100, Math.max(0, y))}%`);
  };

  return (
    <div className="product-gallery grid gap-3 lg:grid-cols-[4.5rem_1fr] lg:gap-4">
      <ul className="order-2 flex gap-2 overflow-x-auto pb-1 lg:order-1 lg:flex-col lg:overflow-visible lg:pb-0">
        {shots.map((src, index) => {
          const selected = active === index;
          return (
            <li key={`${src}-${index}`} className="shrink-0">
              <button
                type="button"
                onClick={() => setActive(index)}
                className={`relative block size-[4.25rem] overflow-hidden bg-neutral-100 transition lg:size-[4.5rem] ${
                  selected
                    ? "ring-1 ring-foreground ring-offset-2 ring-offset-white"
                    : "ring-1 ring-black/10 hover:ring-black/30"
                }`}
                aria-label={`View image ${index + 1}`}
                aria-current={selected ? "true" : undefined}
              >
                <Image src={src} alt="" fill sizes="72px" className="object-cover" />
              </button>
            </li>
          );
        })}
      </ul>

      <div
        ref={stageRef}
        className="relative order-1 aspect-[4/5] overflow-hidden bg-neutral-100 lg:order-2 lg:min-h-[36rem] lg:aspect-[4/5]"
        onMouseEnter={() => setZooming(true)}
        onMouseLeave={() => setZooming(false)}
        onMouseMove={onMove}
      >
        <Image
          src={shots[active] ?? shots[0]!}
          alt={alt}
          fill
          priority
          sizes="(min-width: 1024px) 48vw, 100vw"
          className={`object-cover transition duration-700 ease-out ${
            zooming ? "scale-[1.55]" : "scale-100"
          }`}
          style={{ transformOrigin: origin }}
        />

        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent"
        />

        <div className="pointer-events-none absolute top-4 left-4 z-10 flex items-center gap-2">
          {isNew ? <NewBadge /> : null}
          <span className="bg-black/80 px-2.5 py-1 text-[10px] tracking-[0.18em] text-white uppercase backdrop-blur-sm">
            Bismillah
          </span>
        </div>
        {slug ? <LiveViewers slug={slug} pinned className="absolute top-4 right-4 z-10" /> : null}

        <span
          className={`pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/75 px-3 py-1.5 text-[10px] tracking-[0.16em] text-white uppercase backdrop-blur-sm transition ${
            zooming ? "opacity-0" : "opacity-100"
          }`}
        >
          Hover to zoom
        </span>
      </div>
    </div>
  );
}
