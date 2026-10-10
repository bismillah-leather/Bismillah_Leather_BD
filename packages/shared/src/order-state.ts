/**
 * Three independent machines. A change in one must not imply a change in another.
 * Keep these strings identical to the Prisma enums.
 */
export const ORDER_STATUSES = ["pending", "confirmed", "completed", "cancelled"] as const;
export const PAYMENT_STATUSES = [
  "unpaid",
  "pending",
  "paid",
  "failed",
  "refunded",
  "partially_refunded",
] as const;
export const FULFILLMENT_STATUSES = [
  "unfulfilled",
  "packed",
  "shipped",
  "delivered",
  "failed_delivery",
  "returned",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];
export type FulfillmentStatus = (typeof FULFILLMENT_STATUSES)[number];

const ORDER_TRANSITIONS: Record<OrderStatus, readonly OrderStatus[]> = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["completed", "cancelled"],
  completed: [],
  cancelled: [],
};

const PAYMENT_TRANSITIONS: Record<PaymentStatus, readonly PaymentStatus[]> = {
  unpaid: ["pending", "paid"],
  pending: ["paid", "failed"],
  failed: ["pending"],
  paid: ["refunded", "partially_refunded"],
  partially_refunded: ["refunded", "partially_refunded"],
  refunded: [],
};

const FULFILLMENT_TRANSITIONS: Record<FulfillmentStatus, readonly FulfillmentStatus[]> = {
  unfulfilled: ["packed"],
  packed: ["shipped", "unfulfilled"],
  shipped: ["delivered", "failed_delivery", "returned"],
  failed_delivery: ["shipped", "returned"],
  delivered: ["returned"],
  returned: [],
};

function canTransition<T extends string>(
  table: Record<T, readonly T[]>,
  from: T,
  to: T,
): boolean {
  if (from === to) return true;
  return table[from].includes(to);
}

export function canTransitionOrder(from: OrderStatus, to: OrderStatus): boolean {
  return canTransition(ORDER_TRANSITIONS, from, to);
}

export function canTransitionPayment(from: PaymentStatus, to: PaymentStatus): boolean {
  return canTransition(PAYMENT_TRANSITIONS, from, to);
}

export function canTransitionFulfillment(
  from: FulfillmentStatus,
  to: FulfillmentStatus,
): boolean {
  return canTransition(FULFILLMENT_TRANSITIONS, from, to);
}

export function assertTransition<T extends string>(
  allowed: boolean,
  machine: string,
  from: T,
  to: T,
): void {
  if (!allowed) {
    throw new Error(`Illegal ${machine} transition: ${from} → ${to}`);
  }
}
