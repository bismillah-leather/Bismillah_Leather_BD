import { NextResponse } from "next/server";
import { applyEpsReturn, readEpsFields } from "@/lib/eps";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const fields = await readEpsFields(request);
    await applyEpsReturn(fields, "ipn");
  } catch (error) {
    console.error("[web] eps ipn failed:", error);
  }
  return NextResponse.json({ ok: true });
}

export async function GET(request: Request) {
  return POST(request);
}
