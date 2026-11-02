import { clampDiscount, percentOff } from "./money";
import { SHOWCASE_PRODUCTS, type ShowcaseProduct } from "./showcase";

/** Per-product flash window — each item can end at a different time. */
export type FlashSaleItem = {
  slug: string;
  startsAt: string;
  endsAt: string;
  /** Taka taken off this product, in paisa. Used when no offer price is set. */
  amountOffPaisa?: string;
  /** Admin-set flash price in paisa. When lower than the list price, this is what the store shows. */
  offerPaisa?: string;
};

/** Admin + storefront flash sale contract. Money is paisa; percent is basis points. */
export type FlashSaleConfig = {
  id: string;
  title: string;
  subtitle: string;
  isActive: boolean;
  /** Global fallback start (used when seeding items). */
  startsAt: string;
  /** Global fallback end — section uses per-item endsAt when present. */
  endsAt: string;
  discountKind: "fixed" | "percent";
  /**
   * fixed → paisa off each item (e.g. 20000 = ৳200).
   * percent → basis points (1500 = 15%).
   */
  discountValue: string;
  /** Live flash lineup with per-product timers. */
  items: FlashSaleItem[];
  /** Derived from items — kept for older payloads / simple lists. */
  productSlugs: string[];
};

export type FlashSaleCountdown = {
  totalMs: number;
  hours: number;
  minutes: number;
  seconds: number;
  expired: boolean;
};

type FlashSaleInput = Partial<FlashSaleConfig> & {
  productSlugs?: string[];
  items?: FlashSaleItem[];
};

function keepPaisa(value: unknown): string | undefined {
  return typeof value === "string" && /^\d+$/.test(value) && value !== "0" ? value : undefined;
}

function itemFromSlug(
  slug: string,
  startsAt: string,
  endsAt: string,
  staggerIndex = 0,
  money?: { offerPaisa?: string; amountOffPaisa?: string },
): FlashSaleItem {
  const prices = {
    ...(money?.offerPaisa ? { offerPaisa: money.offerPaisa } : {}),
    ...(money?.amountOffPaisa ? { amountOffPaisa: money.amountOffPaisa } : {}),
  };
  if (staggerIndex <= 0) {
    return { slug, startsAt, endsAt, ...prices };
  }
  const startMs = Date.parse(startsAt);
  const endMs = Date.parse(endsAt);
  if (Number.isNaN(startMs) || Number.isNaN(endMs) || endMs <= startMs) {
    return { slug, startsAt, endsAt, ...prices };
  }
  const span = endMs - startMs;
  const extra = staggerIndex * Math.min(2 * 60 * 60 * 1000, Math.floor(span / 4));
  return {
    slug,
    startsAt,
    endsAt: new Date(endMs + extra).toISOString(),
    ...prices,
  };
}

/** Normalize legacy `productSlugs`-only payloads into per-item timers. */
export function normalizeFlashSale(raw: FlashSaleInput): FlashSaleConfig {
  const base = defaultFlashSale();
  const startsAt = raw.startsAt ?? base.startsAt;
  const endsAt = raw.endsAt ?? base.endsAt;

  let items: FlashSaleItem[] = [];
  if (Array.isArray(raw.items) && raw.items.length > 0) {
    items = raw.items
      .filter((item) => item && typeof item.slug === "string" && item.slug.length > 0)
      .map((item, index) =>
        itemFromSlug(
          item.slug,
          item.startsAt || startsAt,
          item.endsAt || endsAt,
          item.endsAt ? 0 : index,
          {
            offerPaisa: keepPaisa(item.offerPaisa),
            amountOffPaisa: keepPaisa(item.amountOffPaisa),
          },
        ),
      );
  } else if (Array.isArray(raw.productSlugs) && raw.productSlugs.length > 0) {
    items = raw.productSlugs.map((slug, index) => itemFromSlug(slug, startsAt, endsAt, index));
  } else {
    items = base.items;
  }

  const productSlugs = items.map((item) => item.slug);
  const latestEnd = items.reduce((max, item) => {
    const t = Date.parse(item.endsAt);
    return Number.isFinite(t) && t > max ? t : max;
  }, Date.parse(endsAt) || 0);

  return {
    id: raw.id ?? base.id,
    title: raw.title?.trim() || base.title,
    subtitle: raw.subtitle?.trim() || base.subtitle,
    isActive: raw.isActive ?? base.isActive,
    startsAt,
    endsAt: Number.isFinite(latestEnd) ? new Date(latestEnd).toISOString() : endsAt,
    discountKind: raw.discountKind === "percent" ? "percent" : "fixed",
    discountValue: String(raw.discountValue ?? base.discountValue),
    items,
    productSlugs,
  };
}

export function defaultFlashSale(): FlashSaleConfig {
  const startsAt = new Date();
  const endsAt = new Date(startsAt.getTime() + 8 * 60 * 60 * 1000);
  const saleSlugs = SHOWCASE_PRODUCTS.filter((p) => p.salePaisa)
    .slice(0, 6)
    .map((p) => p.slug);
  const slugs =
    saleSlugs.length > 0 ? saleSlugs : SHOWCASE_PRODUCTS.slice(0, 4).map((p) => p.slug);
  const starts = startsAt.toISOString();
  const ends = endsAt.toISOString();
  const items = slugs.map((slug, index) => itemFromSlug(slug, starts, ends, index));

  return {
    id: "demo-flash",
    title: "Flash Sale",
    subtitle: "Limited time · Mirpur leather picks",
    isActive: true,
    startsAt: starts,
    endsAt: items[items.length - 1]?.endsAt ?? ends,
    discountKind: "fixed",
    discountValue: "20000",
    items,
    productSlugs: items.map((item) => item.slug),
  };
}

/** Build endsAt from admin duration input (hours from now). */
export function endsAtFromDurationHours(hours: number, from = new Date()): string {
  const safe = Math.max(0.25, Math.min(720, hours));
  return new Date(from.getTime() + safe * 60 * 60 * 1000).toISOString();
}

export function isFlashSaleItemLive(
  item: FlashSaleItem,
  now = new Date(),
): boolean {
  const start = Date.parse(item.startsAt);
  const end = Date.parse(item.endsAt);
  if (Number.isNaN(start) || Number.isNaN(end)) return false;
  const t = now.getTime();
  return t >= start && t < end;
}

export function isFlashSaleLive(sale: FlashSaleConfig, now = new Date()): boolean {
  if (!sale.isActive) return false;
  const items = sale.items?.length ? sale.items : normalizeFlashSale(sale).items;
  return items.some((item) => isFlashSaleItemLive(item, now));
}

export function flashSaleCountdown(endsAt: string, now = new Date()): FlashSaleCountdown {
  const end = Date.parse(endsAt);
  const totalMs = Number.isNaN(end) ? 0 : Math.max(0, end - now.getTime());
  const totalSec = Math.floor(totalMs / 1000);
  const hours = Math.floor(totalSec / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  const seconds = totalSec % 60;
  return { totalMs, hours, minutes, seconds, expired: totalMs <= 0 };
}

export function flashDiscountPaisa(listPricePaisa: bigint, sale: FlashSaleConfig): bigint {
  const value = BigInt(sale.discountValue || "0");
  if (sale.discountKind === "percent") {
    return clampDiscount(percentOff(listPricePaisa, value), listPricePaisa);
  }
  return clampDiscount(value, listPricePaisa);
}

export function flashSalePricePaisa(
  listPricePaisa: bigint,
  sale: FlashSaleConfig,
  slug?: string,
): bigint {
  if (slug) {
    const item = flashSaleItemForSlug(sale, slug);
    const offer = item?.offerPaisa;
    if (offer && /^\d+$/.test(offer)) {
      const next = BigInt(offer);
      if (next > 0n && next < listPricePaisa) return next;
    }
    const amountOff = item?.amountOffPaisa;
    if (amountOff && /^\d+$/.test(amountOff)) {
      const off = BigInt(amountOff);
      if (off > 0n && off < listPricePaisa) return listPricePaisa - off;
    }
  }
  return listPricePaisa - flashDiscountPaisa(listPricePaisa, sale);
}

export function flashSaleItemForSlug(
  sale: FlashSaleConfig,
  slug: string,
): FlashSaleItem | undefined {
  const items = sale.items?.length ? sale.items : normalizeFlashSale(sale).items;
  return items.find((item) => item.slug === slug);
}

/** Products still inside their own flash window. */
export function flashSaleProducts(sale: FlashSaleConfig, now = new Date()): ShowcaseProduct[] {
  const bySlug = Object.fromEntries(
    SHOWCASE_PRODUCTS.map((p) => [p.slug, p]),
  ) as Record<string, ShowcaseProduct>;
  const items = sale.items?.length ? sale.items : normalizeFlashSale(sale).items;
  return items
    .filter((item) => isFlashSaleItemLive(item, now))
    .map((item) => bySlug[item.slug])
    .filter((p): p is ShowcaseProduct => Boolean(p));
}

export function serializeFlashSale(sale: FlashSaleInput): FlashSaleConfig {
  const normalized = normalizeFlashSale(sale);
  return {
    ...normalized,
    discountValue: String(normalized.discountValue),
    items: normalized.items.map((item) => ({ ...item })),
    productSlugs: [...normalized.productSlugs],
  };
}
