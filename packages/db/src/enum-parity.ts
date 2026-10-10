import assert from "node:assert/strict";
import { FULFILLMENT_STATUSES, ORDER_STATUSES, PAYMENT_STATUSES } from "@bismillah/shared";
import { FulfillmentStatus, OrderStatus, PaymentStatus } from "./generated/prisma/enums";

function same(label: string, actual: Record<string, string>, expected: readonly string[]) {
  assert.deepEqual([...Object.values(actual)].sort(), [...expected].sort(), label);
}

same("order status", OrderStatus, ORDER_STATUSES);
same("payment status", PaymentStatus, PAYMENT_STATUSES);
same("fulfillment status", FulfillmentStatus, FULFILLMENT_STATUSES);
