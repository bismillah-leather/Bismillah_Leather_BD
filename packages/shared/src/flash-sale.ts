import { clampDiscount, percentOff } from "./money";
import { SHOWCASE_PRODUCTS, type ShowcaseProduct } from "./showcase";

/** Admin + storefront flash sale contract. Money is paisa; percent is basis points. */
export type FlashSaleConfig = {
  id: string;
  title: string;
  subtitle: string;
  isActive: boolean;
  /** ISO start */
  startsAt: string;
  /** ISO end — countdown targets this */
  endsAt: string;
  discountKind: "fixed" | "percent";
  /**
   * fixed → paisa off each item (e.g. 20000 = ৳200).
   * percent → basis points (1500 = 15%).
   */
  discountValue: string;
  productSlugs: string[];
};

export type FlashSaleCountdown = {
  totalMs: number;
  hours: number;
  minutes: number;
  seconds: number;
  expired: boolean;
};

export function defaultFlashSale(): FlashSaleConfig {
  const startsAt = new Date();
  const endsAt = new Date(startsAt.getTime() + 8 * 60 * 60 * 1000);
  const saleSlugs = SHOWCASE_PRODUCTS.filter((p) => p.salePaisa)
    .slice(0, 6)
    .map((p) => p.slug);

  return {
    id: "demo-flash",
    title: "Flash Sale",
    subtitle: "Limited time · Mirpur leather picks",
    isActive: true,
    startsAt: startsAt.toISOString(),
    endsAt: endsAt.toISOString(),
    discountKind: "fixed",
    discountValue: "20000",
    productSlugs: saleSlugs.length > 0 ? saleSlugs : SHOWCASE_PRODUCTS.slice(0, 4).map((p) => p.slug),
  };
}

/** Build endsAt from admin duration input (hours from now). */
export function endsAtFromDurationHours(hours: number, from = new Date()): string {
  const safe = Math.max(0.25, Math.min(720, hours));
  return new Date(from.getTime() + safe * 60 * 60 * 1000).toISOString();
}

export function isFlashSaleLive(sale: FlashSaleConfig, now = new Date()): boolean {
  if (!sale.isActive) return false;
  const start = Date.parse(sale.startsAt);
  const end = Date.parse(sale.endsAt);
  if (Number.isNaN(start) || Number.isNaN(end)) return false;
  const t = now.getTime();
  return t >= start && t < end;
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

export function flashSalePricePaisa(listPricePaisa: bigint, sale: FlashSaleConfig): bigint {
  return listPricePaisa - flashDiscountPaisa(listPricePaisa, sale);
}

export function flashSaleProducts(sale: FlashSaleConfig): ShowcaseProduct[] {
  const bySlug = Object.fromEntries(
    SHOWCASE_PRODUCTS.map((p) => [p.slug, p]),
  ) as Record<string, ShowcaseProduct>;
  return sale.productSlugs
    .map((slug) => bySlug[slug])
    .filter((p): p is ShowcaseProduct => Boolean(p));
}

export function serializeFlashSale(sale: FlashSaleConfig): FlashSaleConfig {
  return {
    ...sale,
    discountValue: String(sale.discountValue),
    productSlugs: [...sale.productSlugs],
  };
}
