"use client";

import { LiveViewers } from "./live-viewers";

export function StockUrgency({ slug, stockQty, inStock }: { slug: string; stockQty: number; inStock: boolean }) {
  if (!inStock || stockQty <= 0) {
    return (
      <div className="mt-8 border border-neutral-900 bg-[#171412] px-5 py-5 text-[#f3ece3]">
        <p className="text-[11px] tracking-[0.22em] text-[#cbbfae] uppercase">Availability</p>
        <p className="font-display mt-2 text-3xl tracking-tight">Sold out</p>
      </div>
    );
  }

  const cap = Math.max(stockQty, 12);
  const pct = Math.max(10, Math.round((stockQty / cap) * 100));
  const low = stockQty <= 3;

  return (
    <div className="mt-8 border border-neutral-900 bg-[#171412] px-5 py-5 text-[#f3ece3] sm:px-6 sm:py-6">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[11px] tracking-[0.22em] text-[#cbbfae] uppercase">Availability</p>
        <span className="inline-flex items-center gap-1.5 text-[10px] tracking-[0.2em] text-[#e4c98a] uppercase">
          <span className="relative flex size-2">
            <span className="absolute inset-0 animate-ping rounded-full bg-[#e10600] opacity-75" />
            <span className="relative size-2 rounded-full bg-[#e10600]" />
          </span>
          Live
        </span>
      </div>

      <p className="font-display mt-3 text-3xl tracking-tight sm:text-[2.15rem]">
        {low ? (
          <>
            Only <span className="text-[#f0b2a6]">{stockQty}</span> left
          </>
        ) : (
          <>
            <span className="text-[#e4c98a]">{stockQty}</span> ready to ship
          </>
        )}
      </p>

      <div className="mt-4 h-1.5 overflow-hidden bg-white/10">
        <span
          className={`block h-full ${low ? "bg-[#e10600]" : "bg-[#e4c98a]"}`}
          style={{ width: `${pct}%` }}
        />
      </div>

      <div className="mt-5">
        <LiveViewers slug={slug} pinned tone="line" />
      </div>
    </div>
  );
}
