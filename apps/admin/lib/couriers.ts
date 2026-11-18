import { getPrisma, loadRootEnv, Prisma } from "@bismillah/db";
import {
  BRAND,
  bdMobile11,
  canTransitionFulfillment,
  type FulfillmentStatus,
} from "@bismillah/shared";

const STEADFAST_BASE = "https://portal.packzy.com/api/v1";
const PATHAO_LIVE = "https://api-hermes.pathao.com";
const PATHAO_SANDBOX = "https://courier-api-sandbox.pathao.com";

type CourierName = "steadfast" | "pathao";

type TokenCache = { token: string; refresh: string; expiresAt: number; base: string };
const pathaoCache = globalThis as unknown as { __blPathaoToken?: TokenCache };

export function courierSetup() {
  loadRootEnv();
  const steadfast = Boolean(process.env.STEADFAST_API_KEY && process.env.STEADFAST_SECRET_KEY);
  const pathao = Boolean(
    process.env.PATHAO_CLIENT_ID?.trim() &&
      process.env.PATHAO_CLIENT_SECRET?.trim() &&
      process.env.PATHAO_USERNAME?.trim() &&
      process.env.PATHAO_PASSWORD?.trim(),
  );
  const provider = (process.env.COURIER_PROVIDER || "").trim().toLowerCase();
  const preferred: "pathao" | "steadfast" | null =
    provider === "pathao" || provider === "steadfast" ? provider : null;
  return {
    steadfast,
    pathao,
    preferred,
    pathaoMode: process.env.PATHAO_MODE === "sandbox" ? "sandbox" : "live",
    steadfastMerchantId: (process.env.STEADFAST_MERCHANT_ID ?? "").trim(),
  };
}

function pathaoHosts() {
  loadRootEnv();
  if (process.env.PATHAO_MODE === "sandbox") {
    return [PATHAO_SANDBOX];
  }
  const custom = process.env.PATHAO_BASE_URL?.trim().replace(/\/+$/, "") ?? "";
  return [...new Set([custom, PATHAO_LIVE].filter(Boolean))];
}

function pathaoBase() {
  return pathaoCache.__blPathaoToken?.base || pathaoHosts()[0] || PATHAO_LIVE;
}

function pathaoMessage(payload: {
  message?: string;
  errors?: Record<string, string[] | string>;
}) {
  const details = Object.values(payload.errors ?? {})
    .flatMap((value) => (Array.isArray(value) ? value : [value]))
    .filter(Boolean);
  return [payload.message, ...details].filter(Boolean).join(" — ") || "Pathao request failed.";
}

async function pathaoGet(token: string, path: string) {
  const response = await fetch(`${pathaoBase()}${path}`, {
    headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
    signal: AbortSignal.timeout(20_000),
  });
  return (await response.json().catch(() => ({}))) as {
    data?: { data?: Array<Record<string, unknown>> } | Array<Record<string, unknown>>;
    message?: string;
  };
}

function rowsOf(payload: {
  data?: { data?: Array<Record<string, unknown>> } | Array<Record<string, unknown>>;
}) {
  if (Array.isArray(payload.data)) return payload.data;
  return Array.isArray(payload.data?.data) ? payload.data.data : [];
}

function matchNamed(rows: Array<Record<string, unknown>>, haystack: string, nameKey: string) {
  const hay = haystack.toLowerCase();
  return (
    rows.find((row) => String(row[nameKey] ?? "").toLowerCase() && hay.includes(String(row[nameKey]).toLowerCase())) ??
    rows[0]
  );
}

async function pathaoDestination(token: string, cityText: string, address: string) {
  const hay = `${cityText} ${address}`;
  let cities = rowsOf(await pathaoGet(token, "/aladdin/api/v1/city-list"));
  if (cities.length === 0) {
    cities = rowsOf(await pathaoGet(token, "/aladdin/api/v1/countries/1/city-list"));
  }
  const city = matchNamed(cities, hay, "city_name");
  const cityId = Number(city?.city_id);
  if (!cityId) throw new Error("Pathao city list was empty.");
  const zones = rowsOf(await pathaoGet(token, `/aladdin/api/v1/cities/${cityId}/zone-list`));
  const zone = matchNamed(zones, hay, "zone_name");
  const zoneId = Number(zone?.zone_id);
  if (!zoneId) throw new Error("Pathao zone was not found for this city.");
  return { cityId, zoneId };
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
  loadRootEnv();
  const cached = pathaoCache.__blPathaoToken;
  if (cached && cached.expiresAt > Date.now() + 60_000) return cached.token;

  const passwordBody = {
    client_id: process.env.PATHAO_CLIENT_ID?.trim(),
    client_secret: process.env.PATHAO_CLIENT_SECRET?.trim(),
    username: process.env.PATHAO_USERNAME?.trim(),
    password: process.env.PATHAO_PASSWORD?.trim(),
    grant_type: "password",
  };
  const refreshBody =
    cached?.refresh && cached.expiresAt > Date.now() - 24 * 60 * 60 * 1000
      ? {
          client_id: passwordBody.client_id,
          client_secret: passwordBody.client_secret,
          refresh_token: cached.refresh,
          grant_type: "refresh_token",
        }
      : null;

  let lastMessage = "Pathao login failed.";
  for (const base of pathaoHosts()) {
    for (const body of refreshBody ? [refreshBody, passwordBody] : [passwordBody]) {
      const response = await fetch(`${base}/aladdin/api/v1/issue-token`, {
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
      if (response.ok && payload.access_token) {
        pathaoCache.__blPathaoToken = {
          token: payload.access_token,
          refresh: payload.refresh_token || cached?.refresh || "",
          expiresAt: Date.now() + Math.max(120, payload.expires_in ?? 3600) * 1000,
          base,
        };
        return payload.access_token;
      }
      lastMessage = payload.message || lastMessage;
    }
  }

  pathaoCache.__blPathaoToken = undefined;
  throw new Error(lastMessage);
}

function configuredPathaoStoreIds() {
  const raw = [process.env.PATHAO_STORE_IDS, process.env.PATHAO_STORE_ID]
    .filter(Boolean)
    .join(",");
  const ids = [
    ...new Set(
      raw
        .split(/[,\s]+/)
        .map((part) => Number(part.trim()))
        .filter((id) => Number.isInteger(id) && id > 0),
    ),
  ];
  return ids;
}

async function pathaoStoreIds(token: string) {
  const configured = configuredPathaoStoreIds();
  if (configured.length > 0) return configured;
  const response = await fetch(`${pathaoBase()}/aladdin/api/v1/stores`, {
    headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
    signal: AbortSignal.timeout(20_000),
  });
  const payload = (await response.json().catch(() => ({}))) as {
    data?: { data?: Array<{ store_id?: number }> } | Array<{ store_id?: number }>;
    message?: string;
  };
  const list = Array.isArray(payload.data) ? payload.data : payload.data?.data;
  const ids = (list ?? [])
    .map((row) => Number(row.store_id))
    .filter((id) => Number.isInteger(id) && id > 0);
  if (!response.ok || ids.length === 0) throw new Error(payload.message || "Pathao store was not found.");
  return ids;
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
    return { ok: false as const, error: "Add PATHAO_CLIENT_ID, PATHAO_CLIENT_SECRET, PATHAO_USERNAME, and PATHAO_PASSWORD." };
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
  const storeIds = await pathaoStoreIds(token);
  const destination = await pathaoDestination(token, snap.city || "", address);
  const senderPhone = bdMobile11(process.env.PATHAO_SENDER_PHONE || BRAND.phoneE164);

  let lastError = "Pathao did not book the parcel.";
  for (const storeId of storeIds) {
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
        sender_name: (process.env.PATHAO_SENDER_NAME || BRAND.name).slice(0, 50),
        sender_phone: senderPhone,
        recipient_name: name,
        recipient_phone: phone,
        recipient_address: address,
        recipient_city: destination.cityId,
        recipient_zone: destination.zoneId,
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
      errors?: Record<string, string[] | string>;
      data?: { consignment_id?: string; order_status?: string };
    };
    const consignmentId = payload.data?.consignment_id ?? "";
    if (response.ok && consignmentId) {
      await saveShipment({
        orderId: order.id,
        courier,
        consignmentId,
        trackingCode: consignmentId,
        status: payload.data?.order_status || "pending",
        codPaisa,
        actorId,
        payload: { consignmentId, storeId },
      });
      return { ok: true as const };
    }
    lastError = pathaoMessage(payload);
  }
  return { ok: false as const, error: lastError };
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
