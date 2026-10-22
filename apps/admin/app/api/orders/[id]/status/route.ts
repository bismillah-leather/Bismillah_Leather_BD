import { getPrisma } from "@bismillah/db";
import {
  canTransitionFulfillment,
  canTransitionOrder,
  canTransitionPayment,
  type FulfillmentStatus,
  type OrderStatus,
  type PaymentStatus,
} from "@bismillah/shared";
import { NextResponse } from "next/server";
import { getActiveAdmin } from "@/lib/admin-auth";

type Body = {
  field?: "status" | "paymentStatus" | "fulfillmentStatus";
  value?: string;
};

export async function PATCH(
  request: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const admin = await getActiveAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const { id } = await ctx.params;
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const field = body.field;
  const value = typeof body.value === "string" ? body.value : "";
  if (!field || !value) {
    return NextResponse.json({ error: "field and value required." }, { status: 400 });
  }

  const prisma = getPrisma();
  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) return NextResponse.json({ error: "Order not found." }, { status: 404 });

  if (field === "status") {
    if (!canTransitionOrder(order.status as OrderStatus, value as OrderStatus)) {
      return NextResponse.json(
        { error: `Cannot move ${order.status} → ${value}.` },
        { status: 400 },
      );
    }
  } else if (field === "paymentStatus") {
    if (
      !canTransitionPayment(order.paymentStatus as PaymentStatus, value as PaymentStatus)
    ) {
      return NextResponse.json(
        { error: `Cannot move payment ${order.paymentStatus} → ${value}.` },
        { status: 400 },
      );
    }
  } else if (field === "fulfillmentStatus") {
    if (
      !canTransitionFulfillment(
        order.fulfillmentStatus as FulfillmentStatus,
        value as FulfillmentStatus,
      )
    ) {
      return NextResponse.json(
        { error: `Cannot move fulfillment ${order.fulfillmentStatus} → ${value}.` },
        { status: 400 },
      );
    }
  } else {
    return NextResponse.json({ error: "Unknown field." }, { status: 400 });
  }

  const fromValue =
    field === "status"
      ? order.status
      : field === "paymentStatus"
        ? order.paymentStatus
        : order.fulfillmentStatus;

  await prisma.$transaction([
    prisma.order.update({
      where: { id },
      data: { [field]: value },
    }),
    prisma.orderStatusHistory.create({
      data: {
        orderId: id,
        field:
          field === "status"
            ? "status"
            : field === "paymentStatus"
              ? "payment_status"
              : "fulfillment_status",
        fromValue,
        toValue: value,
        actorId: admin.sub,
      },
    }),
    prisma.auditLog.create({
      data: {
        actorId: admin.sub,
        action: "order.update_status",
        entityType: "Order",
        entityId: id,
        before: { field, fromValue },
        after: { field, value },
      },
    }),
  ]);

  return NextResponse.json({ ok: true });
}
