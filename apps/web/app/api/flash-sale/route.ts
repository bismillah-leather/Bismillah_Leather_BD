import {
  endsAtFromDurationHours,
  serializeFlashSale,
  type FlashSaleConfig,
  type FlashSaleItem,
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

type ItemInput = {
  slug: string;
  durationHours?: number;
  startsAt?: string;
  endsAt?: string;
};

type PutBody = Omit<Partial<FlashSaleConfig>, "items"> & {
  /** Admin convenience: default hours from now → item endsAt when not set per product */
  durationHours?: number;
  items?: ItemInput[];
};

export async function PUT(request: Request) {
  const body = (await request.json()) as PutBody;
  const current = await readFlashSale();
  const now = new Date();

  const defaultHours =
    typeof body.durationHours === "number" && Number.isFinite(body.durationHours)
      ? body.durationHours
      : Math.max(
          1,
          Math.round((Date.parse(current.endsAt) - Date.now()) / (60 * 60 * 1000)) || 8,
        );

  const startsAt =
    body.startsAt ??
    (typeof body.durationHours === "number" ? now.toISOString() : current.startsAt);

  let items: FlashSaleItem[];

  if (Array.isArray(body.items) && body.items.length > 0) {
    items = body.items
      .filter((item) => item?.slug)
      .map((item, index) => {
        const hours =
          typeof item.durationHours === "number" && Number.isFinite(item.durationHours)
            ? item.durationHours
            : defaultHours + index * 2;
        const itemStart = item.startsAt ?? startsAt;
        const itemEnd =
          item.endsAt ??
          endsAtFromDurationHours(hours, item.startsAt ? new Date(item.startsAt) : now);
        return {
          slug: item.slug,
          startsAt: itemStart,
          endsAt: itemEnd,
        };
      });
  } else {
    const slugs = body.productSlugs ?? current.productSlugs;
    items = slugs.map((slug, index) => ({
      slug,
      startsAt,
      endsAt: endsAtFromDurationHours(defaultHours + index * 2, now),
    }));
  }

  if (items.length === 0) {
    return NextResponse.json(
      { error: "Pick at least one product" },
      { status: 400, headers: { "Access-Control-Allow-Origin": "*" } },
    );
  }

  const latestEnd = items.reduce((max, item) => {
    const t = Date.parse(item.endsAt);
    return Number.isFinite(t) && t > max ? t : max;
  }, 0);

  const next = serializeFlashSale({
    ...current,
    id: body.id ?? current.id,
    title: body.title?.trim() || current.title,
    subtitle: body.subtitle?.trim() || current.subtitle,
    isActive: body.isActive ?? current.isActive,
    discountKind: body.discountKind ?? current.discountKind,
    discountValue: String(body.discountValue ?? current.discountValue),
    startsAt,
    endsAt: new Date(latestEnd).toISOString(),
    items,
    productSlugs: items.map((item) => item.slug),
  });

  try {
    await writeFlashSale(next);
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
