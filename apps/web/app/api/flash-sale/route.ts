import { mergeFlashSalePut, readFlashSaleForAdmin, type FlashSalePutBody } from "@bismillah/db";
import { NextResponse } from "next/server";
import { readFlashSale, writeFlashSale } from "@/lib/flash-sale-store";

const cors = { "Access-Control-Allow-Origin": "*" };

export async function GET() {
  const sale = await readFlashSale();
  return NextResponse.json(sale, {
    headers: { ...cors, "Cache-Control": "no-store" },
  });
}

export async function PUT(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400, headers: cors });
  }

  const current = await readFlashSaleForAdmin();
  const next = mergeFlashSalePut(current, (body ?? {}) as FlashSalePutBody);
  if ("error" in next) {
    return NextResponse.json({ error: next.error }, { status: 400, headers: cors });
  }

  try {
    await writeFlashSale(next);
  } catch {
    return NextResponse.json(
      { error: "Could not save flash sale on this host" },
      { status: 500, headers: cors },
    );
  }

  return NextResponse.json(next, { headers: cors });
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      ...cors,
      "Access-Control-Allow-Methods": "GET, PUT, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
