import {
  defaultFlashSale,
  endsAtFromDurationHours,
  serializeFlashSale,
  type FlashSaleConfig,
  type FlashSaleItem,
} from "@bismillah/shared";
import { Prisma } from "./generated/prisma/client";
import { readJsonSetting, writeJsonSetting } from "./json-setting";

const KEY = "flash_sale";

type ItemInput = {
  slug: string;
  durationHours?: number;
  startsAt?: string;
  endsAt?: string;
  amountOffTaka?: number;
  offerTaka?: number;
};

export type FlashSalePutBody = Omit<Partial<FlashSaleConfig>, "items"> & {
  durationHours?: number;
  items?: ItemInput[];
};

function takaToPaisa(value: unknown): string | undefined {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) return undefined;
  return String(Math.round(value * 100));
}

/** Stored config, or null when nothing has been saved yet. */
export async function readStoredFlashSale(): Promise<FlashSaleConfig | null> {
  const value = await readJsonSetting(KEY);
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return serializeFlashSale(value as FlashSaleConfig);
}

export async function writeStoredFlashSale(sale: FlashSaleConfig): Promise<FlashSaleConfig> {
  const next = serializeFlashSale(sale);
  await writeJsonSetting(KEY, next as unknown as Prisma.InputJsonValue);
  return next;
}

export function mergeFlashSalePut(
  current: FlashSaleConfig,
  body: FlashSalePutBody,
): FlashSaleConfig | { error: string } {
  const now = new Date();
  const defaultHours =
    typeof body.durationHours === "number" && Number.isFinite(body.durationHours)
      ? body.durationHours
      : Math.max(1, Math.round((Date.parse(current.endsAt) - Date.now()) / (60 * 60 * 1000)) || 8);

  const startsAt =
    body.startsAt ?? (typeof body.durationHours === "number" ? now.toISOString() : current.startsAt);

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
          item.endsAt ?? endsAtFromDurationHours(hours, item.startsAt ? new Date(item.startsAt) : now);
        const offer = takaToPaisa(item.offerTaka);
        const amountOff = takaToPaisa(item.amountOffTaka);
        return {
          slug: item.slug,
          startsAt: itemStart,
          endsAt: itemEnd,
          ...(offer ? { offerPaisa: offer } : {}),
          ...(amountOff ? { amountOffPaisa: amountOff } : {}),
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

  if (items.length === 0) return { error: "Pick at least one product" };

  const latestEnd = items.reduce((max, item) => {
    const t = Date.parse(item.endsAt);
    return Number.isFinite(t) && t > max ? t : max;
  }, 0);

  return serializeFlashSale({
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
}

export async function readFlashSaleForAdmin(): Promise<FlashSaleConfig> {
  return (await readStoredFlashSale()) ?? defaultFlashSale();
}
