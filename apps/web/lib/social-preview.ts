import type { Metadata } from "next";
import { absoluteUrl } from "@/lib/site-origin";

export const DEFAULT_OG_IMAGE = "/catalog/wallet-black-long.jpg";

function isPrivateObjectHost(hostname: string) {
  const host = hostname.toLowerCase();
  return host.endsWith(".r2.dev") || host.endsWith(".r2.cloudflarestorage.com");
}

/** Prefer same-origin images so Facebook unfurls even when R2 public access is off. */
export function shareImageUrl(origin: string, image?: string | null) {
  const fallback = absoluteUrl(origin, DEFAULT_OG_IMAGE);
  if (!image?.trim()) return fallback;
  const abs = absoluteUrl(origin, image.trim());
  try {
    if (isPrivateObjectHost(new URL(abs).hostname)) return fallback;
  } catch {
    return fallback;
  }
  return abs;
}

export function ogImageTags(url: string, alt: string): NonNullable<Metadata["openGraph"]>["images"] {
  return [{ url, alt, width: 1200, height: 630 }];
}
