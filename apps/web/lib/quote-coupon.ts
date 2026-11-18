import { getPrisma } from "@bismillah/db";
import {
  couponValueLabel,
  formatPaisa,
  normalizeCouponCode,
  quoteCoupon,
  type CouponMath,
} from "@bismillah/shared";

export type CouponQuoteInput = {
  code: string;
  items: Array<{ slug: string; qty: number }>;
  phone?: string | null;
};

export type CouponQuoteView =
  | {
      ok: true;
      couponId: string;
      code: string;
      label: string;
      discountPaisa: string;
      eligiblePaisa: string;
      lineDiscounts: Array<{ slug: string; discountPaisa: string }>;
    }
  | { ok: false; error: string };

function asCouponType(value: string): CouponMath["type"] {
  return value === "fixed" ? "fixed" : "percent";
}

function asCouponScope(value: string): CouponMath["scope"] {
  if (value === "product" || value === "category") return value;
  return "all";
}

export async function quoteCheckoutCoupon(input: CouponQuoteInput): Promise<CouponQuoteView> {
  const code = normalizeCouponCode(input.code);
  if (code.length < 3) return { ok: false, error: "Enter a coupon code." };

  const merged = new Map<string, number>();
  for (const item of input.items) {
    const slug = String(item?.slug ?? "").trim().slice(0, 80);
    const qty = Math.floor(Number(item?.qty));
    if (!slug || !Number.isFinite(qty) || qty < 1) continue;
    merged.set(slug, Math.min(5, (merged.get(slug) ?? 0) + qty));
  }
  if (merged.size === 0) return { ok: false, error: "Add a product before using a coupon." };

  const prisma = getPrisma();
  const coupon = await prisma.coupon.findUnique({
    where: { code },
    select: {
      id: true,
      code: true,
      type: true,
      value: true,
      minSubtotal: true,
      maxDiscount: true,
      usageLimit: true,
      perCustomerLimit: true,
      startsAt: true,
      endsAt: true,
      scope: true,
      isActive: true,
      products: { select: { productId: true } },
      categories: { select: { categoryId: true } },
    },
  });

  const now = new Date();
  if (
    !coupon ||
    !coupon.isActive ||
    (coupon.startsAt && coupon.startsAt > now) ||
    (coupon.endsAt && coupon.endsAt < now)
  ) {
    return { ok: false, error: "This coupon is not valid." };
  }

  if (coupon.usageLimit != null) {
    const used = await prisma.couponRedemption.count({ where: { couponId: coupon.id } });
    if (used >= coupon.usageLimit) {
      return { ok: false, error: "This coupon has already been fully used." };
    }
  }

  const phone = input.phone?.trim();
  if (coupon.perCustomerLimit != null && coupon.perCustomerLimit > 0 && phone) {
    const customer = await prisma.customer.findUnique({
      where: { phone },
      select: { id: true },
    });
    if (customer) {
      const used = await prisma.couponRedemption.count({
        where: { couponId: coupon.id, customerId: customer.id },
      });
      if (used >= coupon.perCustomerLimit) {
        return { ok: false, error: "You have already used this coupon." };
      }
    }
  }

  const products = await prisma.product.findMany({
    where: { slug: { in: [...merged.keys()] }, deletedAt: null, status: "published" },
    select: {
      id: true,
      slug: true,
      name: true,
      primaryCategoryId: true,
      categories: { select: { categoryId: true } },
      variants: {
        where: { isActive: true },
        orderBy: { createdAt: "asc" },
        take: 1,
        select: { price: true, salePrice: true },
      },
    },
  });
  const bySlug = new Map(products.map((product) => [product.slug, product]));

  const lines = [...merged.entries()].flatMap(([slug, qty]) => {
    const product = bySlug.get(slug);
    const variant = product?.variants[0];
    if (!product || !variant) return [];
    const unit = variant.salePrice != null && variant.salePrice > 0n ? variant.salePrice : variant.price;
    const categoryIds = [
      ...new Set([product.primaryCategoryId, ...product.categories.map((row) => row.categoryId)]),
    ];
    return [
      {
        productId: product.id,
        slug: product.slug,
        categoryIds,
        lineTotal: unit * BigInt(qty),
      },
    ];
  });

  if (lines.length === 0) return { ok: false, error: "A product in your cart is no longer available." };

  const math: CouponMath = {
    type: asCouponType(coupon.type),
    value: coupon.value,
    minSubtotal: coupon.minSubtotal,
    maxDiscount: coupon.maxDiscount,
    scope: asCouponScope(coupon.scope),
    productIds: coupon.products.map((row) => row.productId),
    categoryIds: coupon.categories.map((row) => row.categoryId),
  };
  const quoted = quoteCoupon(math, lines);
  if (!quoted.ok) {
    if (quoted.reason === "min_subtotal" && quoted.minSubtotal) {
      return {
        ok: false,
        error: `Spend ${formatPaisa(quoted.minSubtotal)} on eligible items to use this coupon.`,
      };
    }
    return { ok: false, error: "This coupon is not valid for the items in your cart." };
  }

  return {
    ok: true,
    couponId: coupon.id,
    code: coupon.code,
    label: couponValueLabel(math.type, math.value),
    discountPaisa: quoted.discountPaisa.toString(),
    eligiblePaisa: quoted.eligiblePaisa.toString(),
    lineDiscounts: quoted.lines
      .filter((line) => line.discountPaisa > 0n)
      .map((line) => ({ slug: line.slug, discountPaisa: line.discountPaisa.toString() })),
  };
}
