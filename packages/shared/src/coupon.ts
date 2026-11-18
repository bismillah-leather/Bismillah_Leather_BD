import { clampDiscount, percentOff } from "./money";

export type CouponScopeKind = "all" | "category" | "product";
export type CouponTypeKind = "percent" | "fixed";

export type CouponMath = {
  type: CouponTypeKind;
  value: bigint;
  minSubtotal: bigint | null;
  maxDiscount: bigint | null;
  scope: CouponScopeKind;
  productIds: string[];
  categoryIds: string[];
};

export type CouponCartLine = {
  productId: string;
  slug: string;
  categoryIds: string[];
  lineTotal: bigint;
};

export type CouponLineDiscount = {
  productId: string;
  slug: string;
  eligiblePaisa: bigint;
  discountPaisa: bigint;
};

export type CouponQuote =
  | {
      ok: true;
      eligiblePaisa: bigint;
      discountPaisa: bigint;
      lines: CouponLineDiscount[];
    }
  | { ok: false; reason: "not_applicable" | "min_subtotal"; minSubtotal?: bigint };

export function normalizeCouponCode(raw: string) {
  return raw.trim().toUpperCase().replace(/\s+/g, "").slice(0, 32);
}

export function eligibleLinePaisa(coupon: CouponMath, line: CouponCartLine): bigint {
  if (line.lineTotal <= 0n) return 0n;
  if (coupon.scope === "all") return line.lineTotal;
  if (coupon.scope === "product") {
    return coupon.productIds.includes(line.productId) ? line.lineTotal : 0n;
  }
  if (coupon.scope === "category") {
    return line.categoryIds.some((id) => coupon.categoryIds.includes(id)) ? line.lineTotal : 0n;
  }
  return 0n;
}

function allocate(discount: bigint, lines: CouponLineDiscount[]): CouponLineDiscount[] {
  const eligibleIdx = lines.map((line, index) => index).filter((index) => lines[index]!.eligiblePaisa > 0n);
  const eligible = eligibleIdx.reduce((sum, index) => sum + lines[index]!.eligiblePaisa, 0n);
  if (discount <= 0n || eligible <= 0n || eligibleIdx.length === 0) {
    return lines.map((line) => ({ ...line, discountPaisa: 0n }));
  }
  const cuts = lines.map(() => 0n);
  let leftover = discount;
  eligibleIdx.forEach((index, position) => {
    const line = lines[index]!;
    const last = position === eligibleIdx.length - 1;
    const share = last ? leftover : (discount * line.eligiblePaisa) / eligible;
    const capped = share > line.eligiblePaisa ? line.eligiblePaisa : share < 0n ? 0n : share;
    cuts[index] = capped;
    leftover -= capped;
  });
  return lines.map((line, index) => ({ ...line, discountPaisa: cuts[index] ?? 0n }));
}

export function quoteCoupon(coupon: CouponMath, lines: CouponCartLine[]): CouponQuote {
  const sketched: CouponLineDiscount[] = lines.map((line) => ({
    productId: line.productId,
    slug: line.slug,
    eligiblePaisa: eligibleLinePaisa(coupon, line),
    discountPaisa: 0n,
  }));
  const eligiblePaisa = sketched.reduce((sum, line) => sum + line.eligiblePaisa, 0n);
  if (eligiblePaisa <= 0n) return { ok: false, reason: "not_applicable" };

  const min = coupon.minSubtotal;
  if (min != null && min > 0n && eligiblePaisa < min) {
    return { ok: false, reason: "min_subtotal", minSubtotal: min };
  }

  let discount = 0n;
  if (coupon.type === "percent") {
    const points = coupon.value < 0n ? 0n : coupon.value > 10_000n ? 10_000n : coupon.value;
    discount = percentOff(eligiblePaisa, points);
  } else {
    discount = coupon.value > eligiblePaisa ? eligiblePaisa : coupon.value < 0n ? 0n : coupon.value;
  }
  discount = clampDiscount(discount, coupon.maxDiscount);
  if (discount > eligiblePaisa) discount = eligiblePaisa;
  if (discount <= 0n) return { ok: false, reason: "not_applicable" };

  return {
    ok: true,
    eligiblePaisa,
    discountPaisa: discount,
    lines: allocate(discount, sketched),
  };
}

export function couponValueLabel(type: CouponTypeKind, value: bigint) {
  if (type === "percent") return `${Number(value) / 100}% off`;
  const taka = value / 100n;
  return `৳${taka.toString()} off`;
}
