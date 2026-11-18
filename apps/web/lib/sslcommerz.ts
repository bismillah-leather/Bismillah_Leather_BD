import { createHash } from "node:crypto";
import { getPrisma, Prisma } from "@bismillah/db";
import { originFromProxyHeaders } from "@bismillah/shared";
import { headers } from "next/headers";

const MIN_PAISA = 1_000n;

type GatewayMode = "sandbox" | "live";

export function sslcommerzReady() {
  return Boolean(process.env.SSLCOMMERZ_STORE_ID && process.env.SSLCOMMERZ_STORE_PASSWORD);
}

function mode(): GatewayMode {
  return process.env.SSLCOMMERZ_MODE === "live" ? "live" : "sandbox";
}

function gatewayHost() {
  return mode() === "live" ? "https://securepay.sslcommerz.com" : "https://sandbox.sslcommerz.com";
}

function storeId() {
  return process.env.SSLCOMMERZ_STORE_ID?.trim() ?? "";
}

function storePassword() {
  return process.env.SSLCOMMERZ_STORE_PASSWORD ?? "";
}

function bdt(paisa: bigint) {
  const whole = paisa / 100n;
  const frac = paisa % 100n;
  return `${whole}.${frac.toString().padStart(2, "0")}`;
}

function amountsMatch(received: string, expectedPaisa: bigint) {
  const value = Number(received);
  if (!Number.isFinite(value)) return false;
  return Math.abs(value - Number(expectedPaisa) / 100) < 0.01;
}

function methodFromChannel(cardType: string, cardBrand: string) {
  const text = `${cardType} ${cardBrand}`.toLowerCase();
  if (text.includes("bkash")) return "bkash" as const;
  if (text.includes("nagad")) return "nagad" as const;
  return "card" as const;
}

function safeGatewayUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.hostname.endsWith("sslcommerz.com");
  } catch {
    return false;
  }
}

async function publicOrigin() {
  const configured = process.env.NEXT_PUBLIC_STORE_URL?.trim().replace(/\/$/, "");
  if (configured) return configured;
  const requestHeaders = await headers();
  return originFromProxyHeaders((name) => requestHeaders.get(name), "http://localhost:3000");
}

type Snapshot = {
  name?: string;
  phone?: string;
  email?: string | null;
  address?: string;
  city?: string;
  postal?: string;
};

function asSnapshot(value: unknown): Snapshot {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as Snapshot;
}

async function closeFailedAttempt(paymentId: string, orderId: string) {
  const prisma = getPrisma();
  await prisma.payment.update({ where: { id: paymentId }, data: { status: "failed" } });
  const waiting = await prisma.payment.count({
    where: { orderId, provider: "sslcommerz", status: "pending" },
  });
  if (waiting === 0) {
    await prisma.order.updateMany({
      where: { id: orderId, paymentStatus: "pending" },
      data: { paymentStatus: "unpaid" },
    });
  }
}

function asRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

export async function startSslcommerzCheckout(
  orderNumber: string,
): Promise<{ ok: true; number: string; payUrl?: string } | { ok: false; error: string }> {
  if (!sslcommerzReady()) {
    return { ok: false, error: "Online pay is not set up yet. Choose cash on delivery." };
  }

  const prisma = getPrisma();
  const order = await prisma.order.findUnique({
    where: { number: orderNumber },
    select: {
      id: true,
      number: true,
      total: true,
      discountTotal: true,
      paymentStatus: true,
      customerPhone: true,
      customerSnapshot: true,
      items: { select: { name: true, qty: true } },
      payments: { where: { status: "paid" }, take: 1, select: { id: true } },
    },
  });
  if (!order) return { ok: false, error: "Order not found." };
  if (order.paymentStatus === "paid" || order.payments.length > 0) {
    return { ok: true, number: order.number };
  }
  if (order.total < MIN_PAISA) {
    return { ok: false, error: "Online pay starts at ৳10. Choose cash on delivery for this order." };
  }

  const attempts = await prisma.payment.count({
    where: { orderId: order.id, provider: "sslcommerz" },
  });
  const tranId = `${order.number}-${attempts + 1}`.slice(0, 30);
  const payToken = crypto.randomUUID();
  const snap = asSnapshot(order.customerSnapshot);
  const name = (snap.name || "Customer").slice(0, 50);
  const phone = (snap.phone || order.customerPhone).replace(/^\+/, "");
  const email = snap.email || `guest.${phone.replace(/\D/g, "")}@orders.bismillahleather.com`;
  const address = (snap.address || "Dhaka").slice(0, 50);
  const city = (snap.city || "Dhaka").slice(0, 50);
  const postal = (snap.postal || "1000").slice(0, 30);
  const productName = order.items.map((item) => item.name).join(", ").slice(0, 255) || "Leather goods";
  const pieces = order.items.reduce((sum, item) => sum + item.qty, 0);
  const origin = await publicOrigin();

  const body = new URLSearchParams({
    store_id: storeId(),
    store_passwd: storePassword(),
    total_amount: bdt(order.total),
    currency: "BDT",
    tran_id: tranId,
    success_url: `${origin}/pay/sslcommerz/success`,
    fail_url: `${origin}/pay/sslcommerz/fail`,
    cancel_url: `${origin}/pay/sslcommerz/cancel`,
    ipn_url: `${origin}/pay/sslcommerz/ipn`,
    shipping_method: "Courier",
    num_of_item: String(Math.max(1, pieces)),
    product_name: productName,
    product_category: "leather",
    product_profile: "physical-goods",
    product_amount: bdt(order.total + order.discountTotal),
    vat: "0",
    discount_amount: bdt(order.discountTotal),
    emi_option: "0",
    cus_name: name,
    cus_email: email.slice(0, 50),
    cus_add1: address,
    cus_city: city,
    cus_postcode: postal,
    cus_country: "Bangladesh",
    cus_phone: phone.slice(0, 20),
    ship_name: name,
    ship_add1: address,
    ship_city: city,
    ship_area: city,
    ship_postcode: postal,
    ship_country: "Bangladesh",
    value_a: order.number,
    value_b: payToken,
  });

  const payment = await prisma.payment.create({
    data: {
      orderId: order.id,
      provider: "sslcommerz",
      method: "card",
      amount: order.total,
      status: "pending",
      providerTxnId: tranId,
      rawPayload: { payToken, tranId },
    },
    select: { id: true },
  });

  let payload: { status?: string; failedreason?: string; GatewayPageURL?: string; sessionkey?: string };
  try {
    const response = await fetch(`${gatewayHost()}/gwprocess/v4/api.php`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
      signal: AbortSignal.timeout(20_000),
    });
    payload = (await response.json()) as typeof payload;
  } catch (error) {
    console.error("[web] sslcommerz session failed:", error);
    await closeFailedAttempt(payment.id, order.id);
    return { ok: false, error: `Order ${order.number} is saved, but SSLCommerz did not open. Try again.` };
  }

  const gateway = payload.GatewayPageURL ?? "";
  if (payload.status !== "SUCCESS" || !safeGatewayUrl(gateway)) {
    await closeFailedAttempt(payment.id, order.id);
    return {
      ok: false,
      error: (payload.failedreason || `Order ${order.number} is saved, but SSLCommerz did not open.`).slice(0, 180),
    };
  }

  await prisma.payment.update({
    where: { id: payment.id },
    data: { rawPayload: { payToken, tranId, sessionkey: payload.sessionkey ?? "" } },
  });

  return { ok: true, number: order.number, payUrl: gateway };
}

type Validation = {
  status?: string;
  tran_id?: string;
  currency_type?: string;
  currency_amount?: string;
  amount?: string;
  currency?: string;
  card_type?: string;
  card_brand?: string;
  bank_tran_id?: string;
  val_id?: string;
  risk_level?: string;
  risk_title?: string;
  store_amount?: string;
};

async function validateWithGateway(valId: string): Promise<Validation | null> {
  const hashed = createHash("md5").update(storePassword()).digest("hex");
  const url = new URL(`${gatewayHost()}/validator/api/validationserverAPI.php`);
  url.searchParams.set("val_id", valId);
  url.searchParams.set("store_id", storeId());
  url.searchParams.set("store_passwd", hashed);
  url.searchParams.set("v", "1");
  url.searchParams.set("format", "json");
  const response = await fetch(url, { signal: AbortSignal.timeout(20_000) });
  if (!response.ok) return null;
  return (await response.json()) as Validation;
}

export async function readSslFields(request: Request) {
  const fields: Record<string, string> = {};
  if (request.method === "GET") {
    new URL(request.url).searchParams.forEach((value, key) => {
      fields[key] = value;
    });
    return fields;
  }
  const type = request.headers.get("content-type") ?? "";
  if (type.includes("application/json")) {
    const body = (await request.json()) as Record<string, unknown>;
    for (const [key, value] of Object.entries(body)) {
      if (typeof value === "string") fields[key] = value;
    }
    return fields;
  }
  const form = await request.formData();
  form.forEach((value, key) => {
    if (typeof value === "string") fields[key] = value;
  });
  return fields;
}

export async function applySslNotification(fields: Record<string, string>) {
  const tranId = fields.tran_id?.trim() ?? "";
  const posted = (fields.status ?? "").toUpperCase();
  if (!tranId) return { ok: false as const, error: "Missing transaction." };

  const prisma = getPrisma();
  const payment = await prisma.payment.findFirst({
    where: { provider: "sslcommerz", providerTxnId: tranId },
    select: {
      id: true,
      amount: true,
      status: true,
      rawPayload: true,
      order: { select: { id: true, number: true, paymentStatus: true, tags: true } },
    },
  });
  if (!payment) return { ok: false as const, error: "Payment not found." };

  const token = String(asRecord(payment.rawPayload).payToken ?? "");
  if (payment.order.paymentStatus === "paid" || payment.status === "paid") {
    return { ok: true as const, number: payment.order.number, token, state: "paid" as const };
  }

  if (posted === "FAILED" || posted === "CANCELLED" || posted === "EXPIRED" || posted === "UNATTEMPTED") {
    await markOutcome(payment.id, payment.order.id, payment.order.paymentStatus, "failed", posted);
    return {
      ok: true as const,
      number: payment.order.number,
      token,
      state: posted === "CANCELLED" ? ("cancelled" as const) : ("failed" as const),
    };
  }

  const valId = fields.val_id?.trim() ?? "";
  if (!valId || !sslcommerzReady()) {
    return { ok: false as const, error: "Payment could not be checked." };
  }

  let checked: Validation | null = null;
  try {
    checked = await validateWithGateway(valId);
  } catch (error) {
    console.error("[web] sslcommerz validation failed:", error);
    return { ok: false as const, error: "Payment could not be checked." };
  }

  const valid = checked?.status === "VALID" || checked?.status === "VALIDATED";
  const sameTran = checked?.tran_id === tranId;
  const sameMoney =
    checked?.currency_type === "BDT" &&
    amountsMatch(checked.currency_amount || checked.amount || "", payment.amount);
  if (!valid || !sameTran || !sameMoney) {
    await markOutcome(payment.id, payment.order.id, payment.order.paymentStatus, "failed", checked?.status || posted);
    return { ok: true as const, number: payment.order.number, token, state: "failed" as const };
  }

  const risky = checked?.risk_level === "1";
  await prisma.$transaction(async (tx) => {
    const current = await tx.order.findUnique({
      where: { id: payment.order.id },
      select: { paymentStatus: true, tags: true },
    });
    if (!current || current.paymentStatus === "paid") return;
    await tx.payment.update({
      where: { id: payment.id },
      data: {
        status: "paid",
        method: methodFromChannel(checked?.card_type ?? "", checked?.card_brand ?? ""),
        rawPayload: {
          ...asRecord(payment.rawPayload),
          valId,
          bankTranId: checked?.bank_tran_id ?? "",
          cardType: checked?.card_type ?? "",
          cardBrand: checked?.card_brand ?? "",
          riskLevel: checked?.risk_level ?? "",
          riskTitle: checked?.risk_title ?? "",
          storeAmount: checked?.store_amount ?? "",
        } satisfies Prisma.InputJsonObject,
      },
    });
    await tx.order.update({
      where: { id: payment.order.id },
      data: {
        paymentStatus: "paid",
        ...(risky && !current.tags.includes("needs-review")
          ? { tags: [...current.tags, "needs-review"] }
          : {}),
      },
    });
    await tx.orderStatusHistory.create({
      data: {
        orderId: payment.order.id,
        field: "payment_status",
        fromValue: current.paymentStatus,
        toValue: "paid",
        note: risky
          ? "SSLCommerz paid, marked risky. Call the customer before packing."
          : "Paid through SSLCommerz.",
      },
    });
    await tx.paymentEvent.create({
      data: {
        provider: "sslcommerz",
        eventId: valId,
        payload: { tranId, status: checked?.status, bankTranId: checked?.bank_tran_id ?? "" },
        processedAt: new Date(),
      },
    });
  }).catch((error) => {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return;
    throw error;
  });

  return { ok: true as const, number: payment.order.number, token, state: "paid" as const };
}

async function markOutcome(
  paymentId: string,
  orderId: string,
  from: string,
  to: "failed",
  posted: string,
) {
  if (from === "paid") return;
  const prisma = getPrisma();
  await prisma.payment.update({ where: { id: paymentId }, data: { status: "failed" } });
  if (from === "failed") return;
  await prisma.order.update({ where: { id: orderId }, data: { paymentStatus: "failed" } });
  await prisma.orderStatusHistory.create({
    data: {
      orderId,
      field: "payment_status",
      fromValue: from,
      toValue: "failed",
      note: `SSLCommerz ${posted.toLowerCase() || "failed"}.`,
    },
  });
}
