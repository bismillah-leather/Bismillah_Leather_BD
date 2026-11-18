"use client";

import { LiveViewers } from "./live-viewers";

export function StockUrgency({ slug, stockQty, inStock }: { slug: string; stockQty: number; inStock: boolean }) {
  if (!inStock || stockQty <= 0) {
    return (
      <div className="mt-6">
        <p className="text-[13px] font-bold tracking-wide text-black uppercase">Sold out.</p>
      </div>
    );
  }

  const pct = Math.max(8, Math.min(100, Math.round((stockQty / Math.max(stockQty, 10)) * 100)));

  return (
    <div className="mt-6">
      <p className="text-[13px] font-bold tracking-wide text-black uppercase">
        Hurry! Only {stockQty} left in stock.
      </p>
      <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-neutral-200">
        <span className="block h-full rounded-full bg-neutral-400" style={{ width: `${pct}%` }} />
      </div>
      <div className="mt-3">
        <LiveViewers slug={slug} pinned tone="line" />
      </div>
    </div>
  );
}
