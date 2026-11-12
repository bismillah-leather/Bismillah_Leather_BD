"use server";

import { normalizeBdPhone } from "@bismillah/shared";
import { headers } from "next/headers";
import { pushCheckoutAlert } from "@/lib/checkout-alert";
import { placeOrder, type PlaceOrderInput, type PlaceOrderResult } from "@/lib/place-order";
import { clientIp, hitRateLimit } from "@/lib/rate-limit";

export async function placeOrderAction(input: PlaceOrderInput): Promise<PlaceOrderResult> {
  const ip = clientIp(await headers());
  const limited = hitRateLimit(`checkout:${ip}`, 5, 10 * 60 * 1000);
  if (!limited.ok) {
    await pushCheckoutAlert("checkout_rate_limit", ip, "Checkout blocked for this IP");
    return { ok: false, error: "Too many attempts. Wait a few minutes and try again." };
  }

  if ((input.company ?? "").trim()) {
    await pushCheckoutAlert("fake_order", ip, "Blocked a filled honeypot on checkout");
    return { ok: false, error: "Could not place the order. Call the shop." };
  }

  const started = Number(input.startedAt);
  if (Number.isFinite(started) && started > 0) {
    const elapsed = Date.now() - started;
    if (elapsed >= 0 && elapsed < 1_500) {
      await pushCheckoutAlert("fake_order", ip, "Checkout was submitted too fast");
      return { ok: false, error: "Please check the form and try again." };
    }
  }

  const phone = normalizeBdPhone(input.phone) ?? normalizeBdPhone(input.contact);
  if (phone) {
    const byPhone = hitRateLimit(`checkout-phone:${phone}`, 4, 30 * 60 * 1000);
    if (!byPhone.ok) {
      await pushCheckoutAlert("checkout_rate_limit", ip, "Too many checkouts for one number");
      return { ok: false, error: "Too many orders from this number. Wait a bit, or call the shop." };
    }
  }

  const result = await placeOrder(input);
  if (!result.ok && /too many orders from this number|already have this order/i.test(result.error)) {
    await pushCheckoutAlert("fake_order", ip, result.error);
  }
  return result;
}
