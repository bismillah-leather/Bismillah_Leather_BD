import { getPrisma, Prisma } from "@bismillah/db";
import { divisionForDistrict, normalizeBdPhone } from "@bismillah/shared";
import { forget } from "./remember";

const SHIPPING = {
  inside: 8_000n,
  outside: 13_000n,
} as const;

export type PlaceOrderInput = {
  idempotencyKey: string;
  contact: string;
  firstName: string;
  lastName: string;
  phone: string;
  address: string;
  city: string;
  postal: string;
  shipping: string;
  items: Array<{ slug: string; color: string; qty: number }>;
};

export type PlaceOrderResult = { ok: true; number: string } | { ok: false; error: string };

class OrderReject extends Error {}

function clean(value: string, max: number) {
  return value.trim().slice(0, max);
}

function emailFrom(contact: string): string | null {
  const value = contact.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return null;
  return value;
}

export async function placeOrder(input: PlaceOrderInput): Promise<PlaceOrderResult> {
  const key = input.idempotencyKey.trim();
  if (!/^[0-9a-f-]{16,80}$/i.test(key)) {
    return { ok: false, error: "Could not start this order. Refresh and try again." };
  }

  const phone = normalizeBdPhone(input.phone) ?? normalizeBdPhone(input.contact);
  const lastName = clean(input.lastName, 80);
  const firstName = clean(input.firstName, 80);
  const address = clean(input.address, 240);
  const city = clean(input.city, 80);
  const postal = clean(input.postal, 20);
  const shipping = input.shipping === "outside" ? "outside" : input.shipping === "inside" ? "inside" : "";

  if (!phone) return { ok: false, error: "Enter a valid Bangladesh mobile number." };
  if (!lastName || !address || !city || !shipping) {
    return { ok: false, error: "Fill in name, address, city, and phone." };
  }
  if (!Array.isArray(input.items) || input.items.length === 0 || input.items.length > 20) {
    return { ok: false, error: "Your cart is empty." };
  }

  const merged = new Map<string, { slug: string; color: string; qty: number }>();
  for (const item of input.items) {
    const slug = clean(String(item?.slug ?? ""), 80);
    const color = clean(String(item?.color ?? ""), 40) || "Black";
    const qty = Math.floor(Number(item?.qty));
    if (!slug || !Number.isFinite(qty) || qty < 1) continue;
    const id = `${slug}::${color}`;
    const prev = merged.get(id);
    merged.set(id, { slug, color, qty: Math.min(5, (prev?.qty ?? 0) + qty) });
  }
  const lines = [...merged.values()];
  if (lines.length === 0) return { ok: false, error: "Your cart is empty." };

  const name = [firstName, lastName].filter(Boolean).join(" ");
  const email = emailFrom(input.contact);
  const deliveryFee = SHIPPING[shipping];

  try {
    const prisma = getPrisma();
    const existing = await prisma.order.findUnique({
      where: { idempotencyKey: key },
      select: { number: true },
    });
    if (existing) return { ok: true, number: existing.number };

    const products = await prisma.product.findMany({
      where: { slug: { in: lines.map((line) => line.slug) }, deletedAt: null, status: "published" },
      select: {
        id: true,
        name: true,
        slug: true,
        variants: {
          where: { isActive: true },
          orderBy: { createdAt: "asc" },
          take: 1,
          select: {
            id: true,
            sku: true,
            price: true,
            salePrice: true,
            stockOnHand: true,
            stockReserved: true,
          },
        },
        media: {
          where: { type: "image" },
          orderBy: { sortOrder: "asc" },
          take: 1,
          select: { storageKey: true },
        },
      },
    });
    const bySlug = new Map(products.map((product) => [product.slug, product]));

    const priced = lines.map((line) => {
      const product = bySlug.get(line.slug);
      const variant = product?.variants[0];
      if (!product || !variant) {
        throw new OrderReject("A product in your cart is no longer available.");
      }
      const free = variant.stockOnHand - variant.stockReserved;
      if (free < line.qty) {
        throw new OrderReject(`${product.name} does not have enough stock.`);
      }
      const unit = variant.salePrice != null && variant.salePrice > 0n ? variant.salePrice : variant.price;
      return {
        ...line,
        productId: product.id,
        name: product.name,
        variantId: variant.id,
        sku: variant.sku,
        imageKey: product.media[0]?.storageKey ?? null,
        unit,
        lineTotal: unit * BigInt(line.qty),
      };
    });

    const subtotal = priced.reduce((sum, line) => sum + line.lineTotal, 0n);
    const total = subtotal + deliveryFee;

    const number = await prisma.$transaction(
      async (tx) => {
        const again = await tx.order.findUnique({
          where: { idempotencyKey: key },
          select: { number: true },
        });
        if (again) return again.number;

        for (const line of priced) {
          const reserved = await tx.$executeRaw`
            UPDATE product_variants
            SET stock_reserved = stock_reserved + ${line.qty},
                version = version + 1,
                updated_at = NOW()
            WHERE id::text = ${line.variantId}
              AND is_active = true
              AND stock_on_hand - stock_reserved >= ${line.qty}
          `;
          if (reserved !== 1) throw new OrderReject(`${line.name} does not have enough stock.`);
          await tx.product.update({
            where: { id: line.productId },
            data: { soldCount: { increment: line.qty } },
          });
        }

        const customer = await tx.customer.upsert({
          where: { phone },
          create: {
            name,
            phone,
            email,
            orderCount: 1,
            totalSpent: total,
          },
          update: {
            name,
            ...(email ? { email } : {}),
            orderCount: { increment: 1 },
            totalSpent: { increment: total },
          },
        });
        if (customer.isBlocked) throw new OrderReject("This number cannot place an order. Call the shop.");

        await tx.address.create({
          data: {
            customerId: customer.id,
            division: divisionForDistrict(city),
            district: city,
            addressLine: postal ? `${address}, ${postal}` : address,
          },
        });

        const numbered = await tx.$queryRaw<Array<{ next_order_number: string }>>`
          SELECT next_order_number() AS next_order_number
        `;
        const orderNumber = numbered[0]?.next_order_number;
        if (!orderNumber) throw new OrderReject("Could not assign an order number.");

        const snapshot: Prisma.InputJsonValue = {
          name,
          phone,
          email,
          address,
          city,
          postal,
          shipping,
        };

        const order = await tx.order.create({
          data: {
            number: orderNumber,
            customerId: customer.id,
            customerPhone: phone,
            customerSnapshot: snapshot,
            channel: "website",
            source: "direct",
            status: "pending",
            paymentStatus: "unpaid",
            fulfillmentStatus: "unfulfilled",
            subtotal,
            discountTotal: 0n,
            deliveryFee,
            total,
            idempotencyKey: key,
            items: {
              create: priced.map((line) => ({
                variantId: line.variantId,
                name: line.name,
                sku: line.sku,
                variantLabel: line.color,
                imageKey: line.imageKey,
                unitPrice: line.unit,
                qty: line.qty,
                lineTotal: line.lineTotal,
              })),
            },
            payments: {
              create: {
                provider: "cod",
                method: "cod",
                amount: total,
                status: "unpaid",
              },
            },
            history: {
              create: {
                field: "status",
                toValue: "pending",
                note: "Placed on the website",
              },
            },
            reservations: {
              create: priced.map((line) => ({
                variantId: line.variantId,
                qty: line.qty,
                expiresAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
              })),
            },
          },
          select: { number: true },
        });
        return order.number;
      },
      { timeout: 20_000 },
    );

    forget("published-products");
    return { ok: true, number };
  } catch (error) {
    if (error instanceof OrderReject) return { ok: false, error: error.message };
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      const row = await getPrisma().order.findUnique({
        where: { idempotencyKey: key },
        select: { number: true },
      });
      if (row) return { ok: true, number: row.number };
    }
    console.error("[web] place order failed:", error);
    return { ok: false, error: "Could not place the order. Try again in a moment." };
  }
}
