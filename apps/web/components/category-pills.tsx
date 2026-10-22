"use client";

import type { ReactNode } from "react";

/** Shared pill styles — active + hover both go solid black. */
export const categoryPillClass = (active: boolean) =>
  `inline-flex h-7 shrink-0 items-center rounded-full px-3 text-[10px] font-medium tracking-[0.08em] uppercase transition duration-200 sm:h-8 sm:px-3.5 sm:text-[11px] ${
    active
      ? "border border-black bg-black text-white"
      : "border border-neutral-300 bg-white text-neutral-600 hover:border-black hover:bg-black hover:text-white"
  }`;

export function CategoryPillsBar({ children }: { children: ReactNode }) {
  return (
    <div className="sticky top-[var(--site-header-offset,7rem)] z-40 border-b border-border bg-white/95 shadow-[0_4px_16px_rgba(0,0,0,0.04)] backdrop-blur-md">
      <div className="relative mx-auto max-w-7xl">
        <div
          className="pointer-events-none absolute inset-y-0 left-0 z-10 w-5 bg-gradient-to-r from-white to-transparent sm:w-8"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-y-0 right-0 z-10 w-5 bg-gradient-to-l from-white to-transparent sm:w-8"
          aria-hidden
        />
        <div className="flex gap-1.5 overflow-x-auto px-3 py-2.5 [scrollbar-width:none] sm:gap-2 sm:px-6 sm:py-3 [&::-webkit-scrollbar]:hidden">
          {children}
        </div>
      </div>
    </div>
  );
}
