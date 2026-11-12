import { getPrisma, Prisma } from "@bismillah/db";
import {
  bdMobile11,
  canTransitionFulfillment,
  type FulfillmentStatus,
} from "@bismillah/shared";

const STEADFAST_BASE = "https://portal.packzy.com/api/v1";
const PATHAO_LIVE = "https://api-hermes.pathao.com";
const PATHAO_SANDBOX = "https://courier-api-sandbox.pathao.com";

type CourierName = "steadfast" | "pathao";

type TokenCache = { token: string; refresh: string; expiresAt: number };
const pathaoCache = globalThis as unknown as { __blPathaoToken?: TokenCache };

export function courierSetup() {
  const steadfast = Boolean(process.env.STEADFAST_API_KEY && process.env.STEADFAST_SECRET_KEY);
  const pathao = Boolean(
    process.env.PATHAO_CLIENT_ID &&
      process.env.PATHAO_CLIENT_SECRET &&
      process.env.PATHAO_USERNAME &&
      process.env.PATHAO_PASSWORD &&
      process.env.PATHAO_SENDER_PHONE,
  );
  return {
    steadfast,
    pathao,
    pathaoMode: process.env.PATHAO_MODE === "live" ? "live" : "sandbox",
  };
}

function pathaoBase() {
  return process.env.PATHAO_MODE === "live" ? PATHAO_LIVE : PATHAO_SANDBOX;
}

function takaFromPaisa(paisa: bigint) {
  return Number(paisa / 100n);
}

function snapshotOf(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const row = value as Record<string, unknown>;
  return {
    name: typeof row.name === "string" ? row.name : "",
    address: typeof row.address === "string" ? row.address : "",
    city: typeof row.city === "string" ? row.city : "",
    postal: typeof row.postal === "string" ? row.postal : "",
  };
}

async function pathaoToken() {
  const cached = pathaoCache.__blPathaoToken;
  if (cached && cached.expiresAt > Date.now() + 60_000) return cached.token;

  const body =
    cached?.refresh && cached.expiresAt > Date.now() - 24 * 60 * 60 * 1000
      ? {
          client_id: process.env.PATHAO_CLIENT_ID,
          client_secret: process.env.PATHAO_CLIENT_SECRET,
          refresh_token: cached.refresh,
          grant_type: "refresh_token",
        }
      : {
          client_id: process.env.PATHAO_CLIENT_ID,
          client_secret: process.env.PATHAO_CLIENT_SECRET,
          username: process.env.PATHAO_USERNAME,
          password: process.env.PATHAO_PASSWORD,
          grant_type: "password",
        };

  const response = await fetch(`${pathaoBase()}/aladdin/api/v1/issue-token`, {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(20_000),
  });
  const payload = (await response.json().catch(() => ({}))) as {
    access_token?: string;
    refresh_token?: string;
    expires_in?: number;
    message?: string;
  };
  if (!response.ok || !payload.access_token) {
    pathaoCache.__blPathaoToken = undefined;
    throw new Error(payload.message || "Pathao login failed.");
  }
  pathaoCache.__blPathaoToken = {
    token: payload.access_token,
    refresh: payload.refresh_token || cached?.refresh || "",
    expiresAt: Date.now() + Math.max(120, payload.expires_in ?? 3600) * 1000,
  };
  return payload.access_token;
}

async function pathaoStoreId(token: string) {
  const configured = process.env.PATHAO_STORE_ID?.trim();
  if (configured) return Number(configured);
  const response = await fetch(`${pathaoBase()}/aladdin/api/v1/stores`, {
    headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
    signal: AbortSignal.timeout(20_000),
  });
  const payload = (await response.json().catch(() => ({}))) as {
    data?: { data?: Array<{ store_id?: number }> } | Array<{ store_id?: number }>;
    message?: string;
  };
  const list = Array.isArray(payload.data) ? payload.data : payload.data?.data;
  const storeId = list?.[0]?.store_id;
  if (!response.ok || !storeId) throw new Error(payload.message || "Pathao store was not found.");
  return storeId;
}

function stepsToward(current: FulfillmentStatus, wanted: FulfillmentStatus): FulfillmentStatus[] {
  if (wanted === "shipped" && current === "failed_delivery" && canTransitionFulfillment(current, wanted)) {
    return ["shipped"];
  }
  if (wanted === "failed_delivery" || wanted === "returned") {
    return canTransitionFulfillment(current, wanted) ? [wanted] : [];
  }
  const ladder: FulfillmentStatus[] = ["unfulfilled", "packed", "shipped", "delivered"];
  const from = ladder.indexOf(current);
  const to = ladder.indexOf(wanted);
  if (from < 0 || to < 0 || to <= from) return [];
  const steps: FulfillmentStatus[] = [];
  let cursor = current;
  for (let index = from + 1; index <= to; index += 1) {
    const next = ladder[index];
    if (!next || !canTransitionFulfillment(cursor, next)) break;
    steps.push(next);
    cursor = next;
  }
  return steps;
}

function wantedFulfillment(status: string): FulfillmentStatus | null {
  const value = status.toLowerCase();
  if (["delivered", "partial_delivered", "partially_delivered"].includes(value)) return "delivered";
  if (["returned", "return", "paid_return", "cancelled"].includes(value)) return "returned";
  if (["failed", "delivery_failed", "hold"].includes(value)) return "failed_delivery";
  if (["in_transit", "out_for_delivery", "picked", "picked_up", "pickup", "on_the_way"].includes(value)) {
    return "shipped";
  }
  if (["pending", "in_review", "created", "pickup_requested"].includes(value)) return "packed";
  return null;
}

async function saveShipment(input: {
  orderId: string;
  courier: CourierName;
  consignmentId: string;
  trackingCode: string;
  status: string;
  codPaisa: bigint;
  actorId: string;
  payload: Prisma.InputJsonValue;
}) {
  const prisma = getPrisma();
  const order = await prisma.order.findUnique({
    where: { id: input.orderId },
    select: { fulfillmentStatus: true },
  });
  if (!order) throw new Error("Order not found.");
  const current = order.fulfillmentStatus as FulfillmentStatus;
  const steps = stepsToward(current, "shipped");

  return prisma.$transaction(async (tx) => {
    const shipment = await tx.shipment.create({
      data: {
        orderId: input.orderId,
        courier: input.courier,
        consignmentId: input.consignmentId,
        trackingCode: input.trackingCode,
        status: input.status || "pending",
        codAmount: input.codPaisa,
        bookedAt: new Date(),
        events: {
          create: {
            status: input.status || "pending",
            payload: input.payload,
            occurredAt: new Date(),
          },
        },
      },
    });
    let from = current;
    for (const next of steps) {
      await tx.order.update({
        where: { id: input.orderId },
        data: { fulfillmentStatus: next },
      });
      await tx.orderStatusHistory.create({
        data: {
          orderId: input.orderId,
          field: "fulfillment_status",
          fromValue: from,
          toValue: next,
          actorId: input.actorId,
          note: `Booked with ${input.courier}.`,
        },
      });
      from = next;
    }
    return shipment;
  });
}

export async function bookCourier(orderId: string, courier: CourierName, actorId: string) {
  const setup = courierSetup();
  if (courier === "steadfast" && !setup.steadfast) {
    return { ok: false as const, error: "Add STEADFAST_API_KEY and STEADFAST_SECRET_KEY." };
  }
  if (courier === "pathao" && !setup.pathao) {
    return { ok: false as const, error: "Add the Pathao client, login, and sender phone env values." };
  }

  const prisma = getPrisma();
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      number: true,
      status: true,
      total: true,
      paymentStatus: true,
      customerPhone: true,
      customerNote: true,
      customerSnapshot: true,
      items: { select: { name: true, qty: true } },
      shipments: {
        where: { status: { notIn: ["cancelled", "returned"] } },
        take: 1,
        select: { id: true },
      },
    },
  });
  if (!order) return { ok: false as const, error: "Order not found." };
  if (order.status === "cancelled") return { ok: false as const, error: "This order is cancelled." };
  if (order.shipments.length > 0) return { ok: false as const, error: "This order already has a courier booking." };

  const snap = snapshotOf(order.customerSnapshot);
  const phone = bdMobile11(order.customerPhone);
  const name = (snap.name || "Customer").slice(0, 100);
  const address = [snap.address, snap.city, snap.postal].filter(Boolean).join(", ").slice(0, 250);
  if (!phone || address.length < 10) {
    return { ok: false as const, error: "The order needs an 11-digit mobile and a full address." };
  }
  const collect = order.paymentStatus === "paid" ? 0 : takaFromPaisa(order.total);
  const codPaisa = order.paymentStatus === "paid" ? 0n : order.total;
  const pieces = order.items.reduce((sum, item) => sum + item.qty, 0);
  const description = order.items.map((item) => `${item.name} x${item.qty}`).join(", ").slice(0, 250);

  if (courier === "steadfast") {
    const response = await fetch(`${STEADFAST_BASE}/create_order`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Api-Key": process.env.STEADFAST_API_KEY ?? "",
        "Secret-Key": process.env.STEADFAST_SECRET_KEY ?? "",
      },
      body: JSON.stringify({
        invoice: order.number,
        recipient_name: name,
        recipient_phone: phone,
        recipient_address: address,
        cod_amount: collect,
        note: (order.customerNote || "").slice(0, 400),
        item_description: description,
        total_lot: Math.max(1, pieces),
        delivery_type: 0,
      }),
      signal: AbortSignal.timeout(20_000),
    });
    const payload = (await response.json().catch(() => ({}))) as {
      message?: string;
      consignment?: { consignment_id?: number | string; tracking_code?: string; status?: string };
      consignment_id?: number | string;
      tracking_code?: string;
    };
    const consignment = payload.consignment;
    const consignmentId = String(consignment?.consignment_id ?? payload.consignment_id ?? "");
    const trackingCode = consignment?.tracking_code || payload.tracking_code || "";
    if (!response.ok || !consignmentId) {
      return { ok: false as const, error: payload.message || "Steadfast did not book the parcel." };
    }
    await saveShipment({
      orderId: order.id,
      courier,
      consignmentId,
      trackingCode,
      status: consignment?.status || "in_review",
      codPaisa,
      actorId,
      payload: { consignmentId, trackingCode },
    });
    return { ok: true as const };
  }

  const token = await pathaoToken();
  const storeId = await pathaoStoreId(token);
  const senderPhone = bdMobile11(process.env.PATHAO_SENDER_PHONE ?? "");
  if (!senderPhone) return { ok: false as const, error: "PATHAO_SENDER_PHONE must be an 11-digit mobile." };
  const response = await fetch(`${pathaoBase()}/aladdin/api/v1/orders`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      store_id: storeId,
      merchant_order_id: order.number,
      sender_name: (process.env.PATHAO_SENDER_NAME || "Bismillah Leather").slice(0, 50),
      sender_phone: senderPhone,
      recipient_name: name,
      recipient_phone: phone,
      recipient_address: address,
      delivery_type: 48,
      item_type: 2,
      item_quantity: Math.max(1, pieces),
      item_weight: 0.5,
      amount_to_collect: collect,
      item_description: description,
      special_instruction: (order.customerNote || "").slice(0, 200),
    }),
    signal: AbortSignal.timeout(20_000),
  });
  const payload = (await response.json().catch(() => ({}))) as {
    message?: string;
    data?: { consignment_id?: string; order_status?: string };
  };
  const consignmentId = payload.data?.consignment_id ?? "";
  if (!response.ok || !consignmentId) {
    return { ok: false as const, error: payload.message || "Pathao did not book the parcel." };
  }
  await saveShipment({
    orderId: order.id,
    courier,
    consignmentId,
    trackingCode: consignmentId,
    status: payload.data?.order_status || "pending",
    codPaisa,
    actorId,
    payload: { consignmentId },
  });
  return { ok: true as const };
}

export async function refreshShipment(shipmentId: string) {
  const prisma = getPrisma();
  const shipment = await prisma.shipment.findUnique({
    where: { id: shipmentId },
    select: {
      id: true,
      courier: true,
      consignmentId: true,
      trackingCode: true,
      orderId: true,
      order: { select: { fulfillmentStatus: true } },
    },
  });
  if (!shipment?.consignmentId) return { ok: false as const, error: "Shipment not found." };

  let status = "";
  if (shipment.courier === "steadfast") {
    if (!courierSetup().steadfast) return { ok: false as const, error: "Steadfast keys are missing." };
    const response = await fetch(`${STEADFAST_BASE}/status_by_cid/${encodeURIComponent(shipment.consignmentId)}`, {
      headers: {
        "Api-Key": process.env.STEADFAST_API_KEY ?? "",
        "Secret-Key": process.env.STEADFAST_SECRET_KEY ?? "",
      },
      signal: AbortSignal.timeout(20_000),
    });
    const payload = (await response.json().catch(() => ({}))) as { delivery_status?: string; message?: string };
    if (!response.ok || !payload.delivery_status) {
      return { ok: false as const, error: payload.message || "Steadfast status was not available." };
    }
    status = payload.delivery_status;
  } else {
    if (!courierSetup().pathao) return { ok: false as const, error: "Pathao keys are missing." };
    const token = await pathaoToken();
    const response = await fetch(
      `${pathaoBase()}/aladdin/api/v1/orders/${encodeURIComponent(shipment.consignmentId)}/info`,
      {
        headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
        signal: AbortSignal.timeout(20_000),
      },
    );
    const payload = (await response.json().catch(() => ({}))) as {
      message?: string;
      data?: { order_status?: string };
    };
    status = payload.data?.order_status ?? "";
    if (!response.ok || !status) return { ok: false as const, error: payload.message || "Pathao status was not available." };
  }

  const wanted = wantedFulfillment(status);
  const current = shipment.order.fulfillmentStatus as FulfillmentStatus;
  const steps = wanted ? stepsToward(current, wanted) : [];
  await prisma.$transaction(async (tx) => {
    await tx.shipment.update({ where: { id: shipment.id }, data: { status } });
    await tx.shipmentEvent.create({
      data: { shipmentId: shipment.id, status, occurredAt: new Date() },
    });
    let from = current;
    for (const next of steps) {
      await tx.order.update({ where: { id: shipment.orderId }, data: { fulfillmentStatus: next } });
      await tx.orderStatusHistory.create({
        data: {
          orderId: shipment.orderId,
          field: "fulfillment_status",
          fromValue: from,
          toValue: next,
          note: `${shipment.courier} status ${status}.`,
        },
      });
      from = next;
    }
  });
  return { ok: true as const, status };
}
