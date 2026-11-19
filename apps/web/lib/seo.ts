import { readSeoConfig, type SeoConfig } from "@bismillah/db";
import { cache } from "react";
import { remember } from "./remember";

export const getSeoConfig = cache(async (): Promise<SeoConfig> => {
  return remember("seo-config", 20_000, readSeoConfig);
});

export function keywordList(raw: string) {
  return raw
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function isGtmId(value: string) {
  return /^GTM-[A-Z0-9]+$/i.test(value.trim());
}

export function isGa4Id(value: string) {
  return /^G-[A-Z0-9]+$/i.test(value.trim());
}

export function isGoogleAdsId(value: string) {
  return /^AW-\d+$/i.test(value.trim());
}

export function isFacebookPixelId(value: string) {
  return /^\d{5,20}$/.test(value.trim());
}

export function isTiktokPixelId(value: string) {
  return /^[A-Z0-9]{6,40}$/i.test(value.trim());
}
