import { NextResponse } from "next/server";
import { getActiveAdmin } from "@/lib/admin-auth";
import { refreshShipment } from "@/lib/couriers";
import { forgetAdminLists } from "@/lib/ttl-cache";

export async function POST(_request: Request, ctx: { params: Promise<{ id: string }> }) {
  const admin = await getActiveAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const { id } = await ctx.params;
  try {
    const result = await refreshShipment(id);
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
    forgetAdminLists();
    return NextResponse.json({ ok: true, status: result.status });
  } catch (error) {
    console.error("[admin] courier refresh failed:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not refresh the courier." },
      { status: 502 },
    );
  }
}
