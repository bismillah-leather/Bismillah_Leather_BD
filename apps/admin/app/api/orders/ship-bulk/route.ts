import { NextResponse } from "next/server";
import { getActiveAdmin } from "@/lib/admin-auth";
import { bookCourier } from "@/lib/couriers";
import { forgetAdminLists } from "@/lib/ttl-cache";

export async function POST(request: Request) {
  const admin = await getActiveAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  let body: { courier?: string; orderIds?: string[] };
  try {
    body = (await request.json()) as { courier?: string; orderIds?: string[] };
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  if (body.courier !== "steadfast" && body.courier !== "pathao") {
    return NextResponse.json({ error: "Choose Steadfast or Pathao." }, { status: 400 });
  }

  const orderIds = [...new Set((body.orderIds ?? []).filter((id) => typeof id === "string" && id.length > 10))].slice(
    0,
    40,
  );
  if (orderIds.length === 0) {
    return NextResponse.json({ error: "Select at least one order." }, { status: 400 });
  }

  const booked: string[] = [];
  const failed: Array<{ orderId: string; error: string }> = [];

  for (const orderId of orderIds) {
    try {
      const result = await bookCourier(orderId, body.courier, admin.sub);
      if (result.ok) booked.push(orderId);
      else failed.push({ orderId, error: result.error });
    } catch (error) {
      failed.push({
        orderId,
        error: error instanceof Error ? error.message : "Booking failed.",
      });
    }
  }

  forgetAdminLists();
  return NextResponse.json({ ok: failed.length === 0, booked: booked.length, failed });
}
