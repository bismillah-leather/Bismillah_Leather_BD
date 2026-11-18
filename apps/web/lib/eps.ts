import { createHmac } from "node:crypto";
import {
  epsConfigReady,
  getPrisma,
  loadRootEnv,
  Prisma,
  readEpsConfig,
  type EpsConfig,
} from "@bismillah/db";
import { originFromProxyHeaders } from "@bismillah/shared";
import { headers } from "next/headers";

const MIN_PAISA = 1_000n;

export async function epsReady() {
  return epsConfigReady(await readEpsConfig());
}

function hmacSecret(hashKey: string) {
  const compact = hashKey.replace(/\s/g, "");
  if (/^[A-Za-z0-9+/]+=*$/.test(compact) && compact.length % 4 === 0) {
    const decoded = Buffer.from(compact, "base64");
    if (decoded.length >= 16) return decoded;
  }
  return Buffer.from(hashKey, "utf8");
}

function epsHash(value: string, hashKey: string) {
  return createHmac("sha512", hmacSecret(hashKey)).update(value, "utf8").digest("base64");
}

function epsHosts(config: EpsConfig) {
  if (config.mode === "sandbox") {
    return ["https://sandboxpgapi.eps.com.bd", "https://sandbox-pgapi.eps.com.bd"];
  }
  return ["https://pgapi.eps.com.bd", "https://api.eps.com.bd"];
}

function takaNumber(paisa: bigint) {
  return Number(paisa) / 100;
}

function amountsMatch(received: unknown, expectedPaisa: bigint) {
  const value = Number(received);
  if (!Number.isFinite(value)) return false;
  return Math.abs(value - takaNumber(expectedPaisa)) < 0.02;
}

function asRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
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

async function publicOrigin() {
  loadRootEnv();
  const configured = process.env.NEXT_PUBLIC_STORE_URL?.trim().replace(/\/$/, "");
  if (configured) return configured;
  const requestHeaders = await headers();
  return originFromProxyHeaders((name) => requestHeaders.get(name), "http://localhost:3000");
}

function readToken(payload: Record<string, unknown>) {
  const nested = asRecord(payload.data);
  return text(payload.token) || text(payload.Token) || text(nested.token) || text(nested.Token);
}

async function epsToken(config: EpsConfig) {
  let last = "EPS did not issue a token.";
  for (const host of epsHosts(config)) {
    const response = await fetch(`${host}/v1/Auth/GetToken`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "x-hash": epsHash(config.username, config.hashKey),
      },
      body: JSON.stringify({ userName: config.username, password: config.password }),
      signal: AbortSignal.timeout(20_000),
    });
    const payload = (await response.json().catch(() => ({}))) as Record<string, unknown>;
    const token = readToken(payload);
    if (token) return { token, host };
    last = text(payload.errorMessage) || text(payload.ErrorMessage) || last;
  }
  throw new Error(last);
}

type VerifyPayload = {
  Status?: string;
  status?: string;
  TotalAmount?: number | string;
  totalAmount?: number | string;
  MerchantTransactionId?: string;
  merchantTransactionId?: string;
  EPSTransactionId?: string;
  ErrorMessage?: string;
  errorMessage?: string;
};

async function verifyEps(config: EpsConfig, merchantTransactionId: string): Promise<VerifyPayload> {
  const auth = await epsToken(config);
  const url = new URL(`${auth.host}/v1/EPSEngine/CheckMerchantTransactionStatus`);
  url.searchParams.set("merchantTransactionId", merchantTransactionId);
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${auth.token}`,
      Accept: "application/json",
      "x-hash": epsHash(merchantTransactionId, config.hashKey),
    },
    signal: AbortSignal.timeout(20_000),
  });
  return (await response.json().catch(() => ({}))) as VerifyPayload;
}

async function closeFailedAttempt(paymentId: string, orderId: string) {
  const prisma = getPrisma();
  await prisma.payment.update({ where: { id: paymentId }, data: { status: "failed" } });
  const waiting = await prisma.payment.count({
    where: { orderId, provider: "eps", status: "pending" },
  });
  if (waiting === 0) {
    await prisma.order.updateMany({
      where: { id: orderId, paymentStatus: "pending" },
      data: { paymentStatus: "unpaid" },
    });
  }
}

function merchantTxnId() {
  return `${Date.now()}${Math.floor(Math.random() * 900 + 100)}`;
}

export async function startEpsCheckout(
  orderNumber: string,
): Promise<{ ok: true; number: string; payUrl?: string } | { ok: false; error: string }> {
  const config = await readEpsConfig();
  if (!epsConfigReady(config)) {
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
      items: { select: { name: true, qty: true, unitPrice: true } },
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

  const snap = asSnapshot(order.customerSnapshot);
  const name = (snap.name || "Customer").slice(0, 80);
  const phone = (snap.phone || order.customerPhone).replace(/^\+/, "");
  const email = snap.email || `guest.${phone.replace(/\D/g, "")}@orders.bismillahleather.com`;
  const address = (snap.address || "Dhaka").slice(0, 120);
  const city = (snap.city || "Dhaka").slice(0, 50);
  const postal = (snap.postal || "1200").slice(0, 20);
  const productName = order.items.map((item) => item.name).join(", ").slice(0, 120) || "Leather goods";
  const pieces = order.items.reduce((sum, item) => sum + item.qty, 0);
  const origin = await publicOrigin();
  const txnId = merchantTxnId();
  const payToken = crypto.randomUUID();
  const returnQuery = `merchantTransactionId=${encodeURIComponent(txnId)}&token=${encodeURIComponent(payToken)}&order=${encodeURIComponent(order.number)}`;

  const payment = await prisma.payment.create({
    data: {
      orderId: order.id,
      provider: "eps",
      method: "card",
      amount: order.total,
      status: "pending",
      providerTxnId: txnId,
      rawPayload: { payToken, merchantTransactionId: txnId },
    },
    select: { id: true },
  });

  let payload: Record<string, unknown> = {};
  try {
    const auth = await epsToken(config);
    const response = await fetch(`${auth.host}/v1/EPSEngine/InitializeEPS`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${auth.token}`,
        "x-hash": epsHash(txnId, config.hashKey),
      },
      body: JSON.stringify({
        merchantId: config.merchantId,
        storeId: config.storeId,
        CustomerOrderId: order.number,
        merchantTransactionId: txnId,
        transactionTypeId: 10,
        financialEntityId: 0,
        transitionStatusId: 0,
        totalAmount: takaNumber(order.total),
        ipAddress: "0.0.0.0",
        version: "1",
        successUrl: `${origin}/pay/eps/success?${returnQuery}`,
        failUrl: `${origin}/pay/eps/fail?${returnQuery}`,
        cancelUrl: `${origin}/pay/eps/cancel?${returnQuery}`,
        customerName: name,
        customerEmail: email.slice(0, 80),
        customerAddress: address,
        customerAddress2: "",
        customerCity: city,
        customerState: city,
        customerPostcode: postal,
        customerCountry: "BD",
        customerPhone: phone.slice(0, 20),
        shipmentName: name,
        shipmentAddress: address,
        shipmentCity: city,
        shipmentState: city,
        shipmentPostcode: postal,
        shipmentCountry: "BD",
        valueA: order.number,
        valueB: payToken,
        shippingMethod: "Courier",
        noOfItem: String(Math.max(1, pieces)),
        productName,
        productProfile: "physical-goods",
        productCategory: "leather",
        ProductList: order.items.map((item) => ({
          ProductName: item.name.slice(0, 80),
          NoOfItem: String(item.qty),
          ProductProfile: "leather",
          ProductCategory: "leather",
          ProductPrice: String(takaNumber(item.unitPrice)),
        })),
      }),
      signal: AbortSignal.timeout(25_000),
    });
    payload = (await response.json().catch(() => ({}))) as Record<string, unknown>;
  } catch (error) {
    console.error("[web] eps initialize failed:", error);
    await closeFailedAttempt(payment.id, order.id);
    return { ok: false, error: `Order ${order.number} is saved, but EPS did not open. Try COD or try again.` };
  }

  const nested = asRecord(payload.data);
  const gateway =
    text(payload.RedirectURL) ||
    text(payload.redirectURL) ||
    text(payload.RedirectUrl) ||
    text(nested.RedirectURL) ||
    text(nested.redirectURL);
  if (!gateway.startsWith("https://")) {
    await closeFailedAttempt(payment.id, order.id);
    return {
      ok: false,
      error: (
        text(payload.ErrorMessage) ||
        text(payload.errorMessage) ||
        text(nested.ErrorMessage) ||
        `Order ${order.number} is saved, but EPS did not open.`
      ).slice(0, 180),
    };
  }

  return { ok: true, number: order.number, payUrl: gateway };
}

export async function readEpsFields(request: Request) {
  const fields: Record<string, string> = {};
  const url = new URL(request.url);
  url.searchParams.forEach((value, key) => {
    fields[key] = value;
  });
  if (request.method !== "GET") {
    const type = request.headers.get("content-type") ?? "";
    try {
      if (type.includes("application/json")) {
        const body = (await request.json()) as Record<string, unknown>;
        for (const [key, value] of Object.entries(body)) {
          if (typeof value === "string" || typeof value === "number") fields[key] = String(value);
        }
      } else {
        const form = await request.formData();
        form.forEach((value, key) => {
          if (typeof value === "string") fields[key] = value;
        });
      }
    } catch {
      // Return URLs sometimes have an empty body.
    }
  }
  return fields;
}

function merchantIdFromFields(fields: Record<string, string>) {
  const lower: Record<string, string> = {};
  for (const [key, value] of Object.entries(fields)) lower[key.toLowerCase()] = value;
  return (
    lower.merchanttransactionid ||
    lower.epstransactionid ||
    lower.tran_id ||
    lower.token ||
    ""
  ).trim();
}

export async function applyEpsReturn(fields: Record<string, string>, hint: "success" | "fail" | "cancel" | "ipn") {
  const txnId = merchantIdFromFields(fields);
  const orderNumber = (fields.order || fields.CustomerOrderId || fields.customerOrderId || "").trim();
  const payToken = (fields.token || "").trim();

  const prisma = getPrisma();
  const payment = txnId
    ? await prisma.payment.findFirst({
        where: {
          provider: "eps",
          OR: [{ providerTxnId: txnId }, { rawPayload: { path: ["payToken"], equals: txnId } }],
        },
        select: {
          id: true,
          amount: true,
          status: true,
          rawPayload: true,
          providerTxnId: true,
          order: { select: { id: true, number: true, paymentStatus: true } },
        },
        orderBy: { createdAt: "desc" },
      })
    : payToken || orderNumber
      ? await prisma.payment.findFirst({
          where: {
            provider: "eps",
            ...(payToken ? { rawPayload: { path: ["payToken"], equals: payToken } } : {}),
            ...(orderNumber ? { order: { number: orderNumber } } : {}),
          },
          select: {
            id: true,
            amount: true,
            status: true,
            rawPayload: true,
            providerTxnId: true,
            order: { select: { id: true, number: true, paymentStatus: true } },
          },
          orderBy: { createdAt: "desc" },
        })
      : null;
  if (!payment) return { ok: false as const, error: "Payment not found." };
  const merchantTxn = payment.providerTxnId || txnId;

  const token = String(asRecord(payment.rawPayload).payToken ?? "");
  if (payment.order.paymentStatus === "paid" || payment.status === "paid") {
    return { ok: true as const, number: payment.order.number, token, state: "paid" as const };
  }

  const config = await readEpsConfig();
  if (!epsConfigReady(config)) {
    return { ok: false as const, error: "EPS is not configured." };
  }

  let verified: VerifyPayload = {};
  try {
    verified = await verifyEps(config, merchantTxn);
  } catch (error) {
    console.error("[web] eps verify failed:", error);
    return { ok: false as const, error: "Payment could not be checked." };
  }

  const status = (verified.Status || verified.status || "").toLowerCase();
  const paid = status === "success";
  const reported = verified.TotalAmount ?? verified.totalAmount;
  const amountOk = reported == null || reported === "" ? true : amountsMatch(reported, payment.amount);

  if (paid && amountOk) {
    await prisma.$transaction(async (tx) => {
      const current = await tx.order.findUnique({
        where: { id: payment.order.id },
        select: { paymentStatus: true },
      });
      if (!current || current.paymentStatus === "paid") return;
      await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: "paid",
          rawPayload: {
            ...asRecord(payment.rawPayload),
            epsTransactionId: verified.EPSTransactionId ?? "",
            status,
          } satisfies Prisma.InputJsonObject,
        },
      });
      await tx.order.update({
        where: { id: payment.order.id },
        data: { paymentStatus: "paid" },
      });
      await tx.orderStatusHistory.create({
        data: {
          orderId: payment.order.id,
          field: "payment_status",
          fromValue: current.paymentStatus,
          toValue: "paid",
          note: "Paid through EPS.",
        },
      });
      await tx.paymentEvent.create({
        data: {
          provider: "eps",
          eventId: text(verified.EPSTransactionId) || `${merchantTxn}-paid`,
          payload: { merchantTransactionId: merchantTxn, status },
          processedAt: new Date(),
        },
      });
    }).catch((error) => {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return;
      throw error;
    });
    return { ok: true as const, number: payment.order.number, token, state: "paid" as const };
  }

  if (hint === "cancel" || hint === "fail") {
    await prisma.payment.update({
      where: { id: payment.id },
      data: { status: "failed", rawPayload: { ...asRecord(payment.rawPayload), status: status || hint } },
    });
    if (payment.order.paymentStatus === "pending") {
      await prisma.order.update({
        where: { id: payment.order.id },
        data: { paymentStatus: "failed" },
      });
    }
    return {
      ok: true as const,
      number: payment.order.number,
      token,
      state: hint === "cancel" ? ("cancelled" as const) : ("failed" as const),
    };
  }

  return { ok: true as const, number: payment.order.number, token, state: "failed" as const };
}
