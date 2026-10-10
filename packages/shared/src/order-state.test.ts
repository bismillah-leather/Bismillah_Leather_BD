import { describe, expect, it } from "vitest";
import {
  assertTransition,
  canTransitionFulfillment,
  canTransitionOrder,
  canTransitionPayment,
} from "./order-state";

describe("order state machine", () => {
  it("confirms a pending order and refuses to reopen a cancelled one", () => {
    expect(canTransitionOrder("pending", "confirmed")).toBe(true);
    expect(canTransitionOrder("confirmed", "completed")).toBe(true);
    expect(canTransitionOrder("cancelled", "confirmed")).toBe(false);
    expect(canTransitionOrder("completed", "cancelled")).toBe(false);
  });
});

describe("payment state machine", () => {
  it("lets COD jump from unpaid to paid and blocks a second capture", () => {
    expect(canTransitionPayment("unpaid", "paid")).toBe(true);
    expect(canTransitionPayment("pending", "paid")).toBe(true);
    expect(canTransitionPayment("paid", "pending")).toBe(false);
    expect(canTransitionPayment("paid", "refunded")).toBe(true);
  });
});

describe("fulfillment state machine", () => {
  it("follows the courier path and allows a return after delivery", () => {
    expect(canTransitionFulfillment("unfulfilled", "packed")).toBe(true);
    expect(canTransitionFulfillment("packed", "shipped")).toBe(true);
    expect(canTransitionFulfillment("shipped", "delivered")).toBe(true);
    expect(canTransitionFulfillment("delivered", "returned")).toBe(true);
    expect(canTransitionFulfillment("unfulfilled", "delivered")).toBe(false);
  });
});

describe("assertTransition", () => {
  it("throws a stable message for an illegal move", () => {
    expect(() => assertTransition(false, "order", "cancelled", "confirmed")).toThrow(
      "Illegal order transition: cancelled → confirmed",
    );
  });
});
