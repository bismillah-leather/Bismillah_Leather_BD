import { describe, expect, it } from "vitest";
import { quoteCoupon } from "./coupon";

const wallet = { productId: "p1", slug: "wallet", categoryIds: ["c1"], lineTotal: 200_000n };
const belt = { productId: "p2", slug: "belt", categoryIds: ["c2"], lineTotal: 150_000n };

describe("quoteCoupon", () => {
  it("cuts only the linked product when two items are in the cart", () => {
    const quote = quoteCoupon(
      {
        type: "percent",
        value: 1000n,
        minSubtotal: null,
        maxDiscount: null,
        scope: "product",
        productIds: ["p1"],
        categoryIds: [],
      },
      [wallet, belt],
    );
    expect(quote.ok).toBe(true);
    if (!quote.ok) return;
    expect(quote.discountPaisa).toBe(20_000n);
    expect(quote.lines.find((line) => line.slug === "wallet")?.discountPaisa).toBe(20_000n);
    expect(quote.lines.find((line) => line.slug === "belt")?.discountPaisa).toBe(0n);
  });

  it("splits a store-wide percent across both products", () => {
    const quote = quoteCoupon(
      {
        type: "percent",
        value: 1000n,
        minSubtotal: null,
        maxDiscount: null,
        scope: "all",
        productIds: [],
        categoryIds: [],
      },
      [wallet, belt],
    );
    expect(quote.ok).toBe(true);
    if (!quote.ok) return;
    expect(quote.discountPaisa).toBe(35_000n);
    expect(quote.lines.reduce((sum, line) => sum + line.discountPaisa, 0n)).toBe(35_000n);
  });

  it("caps a fixed coupon to the eligible line", () => {
    const quote = quoteCoupon(
      {
        type: "fixed",
        value: 500_000n,
        minSubtotal: null,
        maxDiscount: null,
        scope: "product",
        productIds: ["p2"],
        categoryIds: [],
      },
      [wallet, belt],
    );
    expect(quote.ok).toBe(true);
    if (!quote.ok) return;
    expect(quote.discountPaisa).toBe(150_000n);
  });

  it("rejects when the cart has none of the coupon products", () => {
    const quote = quoteCoupon(
      {
        type: "percent",
        value: 1000n,
        minSubtotal: null,
        maxDiscount: null,
        scope: "product",
        productIds: ["other"],
        categoryIds: [],
      },
      [wallet, belt],
    );
    expect(quote).toEqual({ ok: false, reason: "not_applicable" });
  });
});
