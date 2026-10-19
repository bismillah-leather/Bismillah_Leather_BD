import {
  endsAtFromDurationHours,
  serializeFlashSale,
  type FlashSaleConfig,
} from "@bismillah/shared";
import { NextResponse } from "next/server";
import { readFlashSale, writeFlashSale } from "@/lib/flash-sale-store";

export async function GET() {
  const sale = await readFlashSale();
  return NextResponse.json(sale, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "no-store",
    },
  });
}

type PutBody = Partial<FlashSaleConfig> & {
  /** Admin convenience: hours from now → endsAt */
  durationHours?: number;
};

export async function PUT(request: Request) {
  const body = (await request.json()) as PutBody;
  const current = await readFlashSale();

  const next: FlashSaleConfig = {
    ...current,
    ...body,
    id: body.id ?? current.id,
    title: body.title?.trim() || current.title,
    subtitle: body.subtitle?.trim() || current.subtitle,
    isActive: body.isActive ?? current.isActive,
    discountKind: body.discountKind ?? current.discountKind,
    discountValue: String(body.discountValue ?? current.discountValue),
    productSlugs: body.productSlugs ?? current.productSlugs,
    startsAt: body.startsAt ?? current.startsAt,
    endsAt: body.endsAt ?? current.endsAt,
  };

  if (typeof body.durationHours === "number" && Number.isFinite(body.durationHours)) {
    const startsAt = new Date();
    next.startsAt = startsAt.toISOString();
    next.endsAt = endsAtFromDurationHours(body.durationHours, startsAt);
  }

  if (!Array.isArray(next.productSlugs) || next.productSlugs.length === 0) {
    return NextResponse.json(
      { error: "Pick at least one product" },
      { status: 400, headers: { "Access-Control-Allow-Origin": "*" } },
    );
  }

  try {
    await writeFlashSale(serializeFlashSale(next));
  } catch {
    return NextResponse.json(
      { error: "Could not save flash sale on this host" },
      { status: 500, headers: { "Access-Control-Allow-Origin": "*" } },
    );
  }

  return NextResponse.json(next, {
    headers: { "Access-Control-Allow-Origin": "*" },
  });
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, PUT, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
