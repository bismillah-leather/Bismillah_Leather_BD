"use server";

import { headers } from "next/headers";
import { clientIp, hitRateLimit } from "@/lib/rate-limit";
import { syncProductViewers } from "@/lib/product-viewers";

export async function syncProductViewersAction(input: {
  visitorId: string;
  slugs: string[];
}): Promise<Record<string, number> | null> {
  const ip = clientIp(await headers());
  const limited = hitRateLimit(`viewers:${ip}`, 40, 60 * 1000);
  if (!limited.ok) return null;
  const visitorId = typeof input?.visitorId === "string" ? input.visitorId : "";
  const slugs = Array.isArray(input?.slugs) ? input.slugs.filter((slug) => typeof slug === "string") : [];
  return syncProductViewers(visitorId, slugs);
}
