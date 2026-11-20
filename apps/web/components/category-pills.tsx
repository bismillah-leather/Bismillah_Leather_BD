"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";

/** Shared pill styles — active + hover both go solid black. */
export const categoryPillClass = (active: boolean) =>
  `inline-flex h-7 shrink-0 items-center rounded-full px-3 text-[10px] font-medium tracking-[0.08em] uppercase transition duration-200 sm:h-8 sm:px-3.5 sm:text-[11px] ${
    active
      ? "border border-black bg-black text-white"
      : "border border-neutral-400 bg-white text-neutral-900 shadow-sm hover:border-black hover:bg-black hover:text-white"
  }`;

export function CategoryPillsBar({ children }: { children: ReactNode }) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  function updateEdges() {
    const node = scrollerRef.current;
    if (!node) return;
    const max = node.scrollWidth - node.clientWidth;
    setCanPrev(node.scrollLeft > 4);
    setCanNext(max > 4 && node.scrollLeft < max - 4);
  }

  useEffect(() => {
    const node = scrollerRef.current;
    if (!node) return;
    updateEdges();
    const onScroll = () => updateEdges();
    const onWheel = (event: WheelEvent) => {
      const mostlyVertical = Math.abs(event.deltaY) >= Math.abs(event.deltaX);
      if (!mostlyVertical || event.deltaY === 0) return;
      const max = node.scrollWidth - node.clientWidth;
      if (max <= 4) return;
      const next = node.scrollLeft + event.deltaY;
      if ((next <= 0 && node.scrollLeft <= 0) || (next >= max && node.scrollLeft >= max - 1)) {
        return;
      }
      event.preventDefault();
      node.scrollLeft = next;
    };
    node.addEventListener("scroll", onScroll, { passive: true });
    node.addEventListener("wheel", onWheel, { passive: false });
    const observer = new ResizeObserver(updateEdges);
    observer.observe(node);
    window.addEventListener("resize", updateEdges);
    return () => {
      node.removeEventListener("scroll", onScroll);
      node.removeEventListener("wheel", onWheel);
      observer.disconnect();
      window.removeEventListener("resize", updateEdges);
    };
  }, []);

  function scrollByDir(dir: -1 | 1) {
    const node = scrollerRef.current;
    if (!node) return;
    node.scrollBy({ left: dir * Math.max(220, node.clientWidth * 0.55), behavior: "smooth" });
  }

  return (
    <div className="sticky top-[var(--site-header-offset,7rem)] z-[190] border-b border-neutral-200 bg-white shadow-[0_8px_24px_rgba(0,0,0,0.06)]">
      <div className="relative mx-auto max-w-7xl">
        {canPrev ? (
          <button
            type="button"
            aria-label="Previous categories"
            onClick={() => scrollByDir(-1)}
            className="absolute top-1/2 left-1 z-20 hidden size-8 -translate-y-1/2 items-center justify-center rounded-full border border-neutral-200 bg-white text-foreground shadow-sm md:inline-flex"
          >
            <ChevronLeft className="size-4" />
          </button>
        ) : null}
        {canNext ? (
          <button
            type="button"
            aria-label="More categories"
            onClick={() => scrollByDir(1)}
            className="absolute top-1/2 right-1 z-20 hidden size-8 -translate-y-1/2 items-center justify-center rounded-full border border-neutral-200 bg-white text-foreground shadow-sm md:inline-flex"
          >
            <ChevronRight className="size-4" />
          </button>
        ) : null}
        <div
          className="pointer-events-none absolute inset-y-0 left-0 z-10 w-8 bg-gradient-to-r from-white to-transparent md:w-12"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-y-0 right-0 z-10 w-8 bg-gradient-to-l from-white to-transparent md:w-12"
          aria-hidden
        />
        <div
          ref={scrollerRef}
          className="flex gap-1.5 overflow-x-auto overscroll-x-contain px-3 py-2.5 [scrollbar-width:thin] sm:gap-2 sm:px-6 sm:py-3 md:px-12"
        >
          <div className="flex w-max flex-nowrap items-center gap-1.5 sm:gap-2">{children}</div>
        </div>
      </div>
    </div>
  );
}
