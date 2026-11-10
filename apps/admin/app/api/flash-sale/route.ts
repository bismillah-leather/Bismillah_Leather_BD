import {
  mergeFlashSalePut,
  readFlashSaleForAdmin,
  writeStoredFlashSale,
  type FlashSalePutBody,
} from "@bismillah/db";
import { NextResponse } from "next/server";
import { getActiveAdmin } from "@/lib/admin-auth";

export async function GET() {
  const admin = await getActiveAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const sale = await readFlashSaleForAdmin();
  return NextResponse.json(sale, { headers: { "Cache-Control": "no-store" } });
}

export async function PUT(request: Request) {
  const admin = await getActiveAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const current = await readFlashSaleForAdmin();
  const next = mergeFlashSalePut(current, (body ?? {}) as FlashSalePutBody);
  if ("error" in next) {
    return NextResponse.json({ error: next.error }, { status: 400 });
  }

  try {
    await writeStoredFlashSale(next);
  } catch (error) {
    console.error("[admin] flash sale save failed:", error);
    return NextResponse.json({ error: "Could not save the flash sale." }, { status: 500 });
  }

  return NextResponse.json(next);
}
