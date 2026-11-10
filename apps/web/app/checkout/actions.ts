"use server";

import { headers } from "next/headers";
import { clientIp, hitRateLimit } from "@/lib/rate-limit";
import { placeOrder, type PlaceOrderInput, type PlaceOrderResult } from "@/lib/place-order";

export async function placeOrderAction(input: PlaceOrderInput): Promise<PlaceOrderResult> {
  const ip = clientIp(await headers());
  const limited = hitRateLimit(`checkout:${ip}`, 8, 15 * 60 * 1000);
  if (!limited.ok) {
    return { ok: false, error: "Too many attempts. Wait a few minutes and try again." };
  }
  return placeOrder(input);
}
