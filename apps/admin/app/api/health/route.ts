import { NextResponse } from "next/server";
import { NO_STORE_HEADERS } from "@/lib/no-store";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  return NextResponse.json({ ok: true, service: "admin" }, { headers: NO_STORE_HEADERS });
}
