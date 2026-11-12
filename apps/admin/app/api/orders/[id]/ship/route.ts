import { NextResponse } from "next/server";
import { getActiveAdmin } from "@/lib/admin-auth";
import { bookCourier } from "@/lib/couriers";
import { forgetAdminLists } from "@/lib/ttl-cache";

export async function POST(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const admin = await getActiveAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const { id } = await ctx.params;
  let body: { courier?: string };
  try {
    body = (await request.json()) as { courier?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }
  if (body.courier !== "steadfast" && body.courier !== "pathao") {
    return NextResponse.json({ error: "Choose Steadfast or Pathao." }, { status: 400 });
  }

  try {
    const result = await bookCourier(id, body.courier, admin.sub);
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
    forgetAdminLists();
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[admin] courier book failed:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Courier booking failed." },
      { status: 502 },
    );
  }
}
