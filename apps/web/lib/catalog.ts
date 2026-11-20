import { getPrisma } from "@bismillah/db";
import {
  productBySlug as showcaseBySlug,
  SHOWCASE_PRODUCTS,
  type LeatherTone,
  type ProductKind,
  type ShowcaseProduct,
} from "@bismillah/shared";
import { cache } from "react";
import { remember } from "./remember";

type DbProductRow = {
  id: string;
  name: string;
  slug: string;
  description: string;
  ogImageKey: string | null;
  isNew: boolean;
  ratingAvg: { toNumber(): number } | number;
  ratingCount: number;
  primaryCategory: { slug: string; path: string };
  variants: Array<{
    sku: string;
    price: bigint;
    salePrice: bigint | null;
    stockOnHand: number;
    stockReserved: number;
  }>;
  media: Array<{ type: string; storageKey: string; sortOrder: number }>;
};

function inferKind(categorySlug: string): ProductKind {
  return categorySlug.includes("belt") ? "belt" : "wallet";
}

function inferTone(name: string, fallback?: LeatherTone): LeatherTone {
  const n = name.toLowerCase();
  if (n.includes("brown") || n.includes("buffalo")) return "brown";
  if (n.includes("tan")) return "tan";
  if (n.includes("cognac") || n.includes("chocolate") || n.includes("espresso")) return "cognac";
  if (n.includes("black")) return "black";
  return fallback ?? "black";
}

function mapRow(row: DbProductRow): ShowcaseProduct {
  const fallback = showcaseBySlug(row.slug);
  const variant = row.variants[0];
  const images = row.media
    .filter((m) => m.type === "image")
    .sort((a, b) => a.sortOrder - b.sortOrder);
  const video = row.media.find((m) => m.type === "video");
  const categorySlug = row.primaryCategory.slug || row.primaryCategory.path;
  const available = variant
    ? Math.max(0, variant.stockOnHand - variant.stockReserved)
    : 0;

  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    sku: variant?.sku ?? fallback?.sku ?? `BL-${row.slug.slice(0, 8).toUpperCase()}`,
    categorySlug,
    pricePaisa: variant?.price ?? fallback?.pricePaisa ?? 0n,
    salePaisa: variant?.salePrice ?? fallback?.salePaisa ?? null,
    image:
      images[0]?.storageKey ||
      row.ogImageKey ||
      fallback?.image ||
      "/catalog/wallet-black-long.jpg",
    colors: fallback?.colors ?? ["Black"],
    tone: inferTone(row.name, fallback?.tone),
    kind: fallback?.kind ?? inferKind(categorySlug),
    inStock: variant ? available > 0 : false,
    stockQty: variant ? available : 0,
    isNew: row.isNew,
    blurb: row.description?.trim() || fallback?.blurb || "",
    highlights: fallback?.highlights,
    videoUrl: video?.storageKey || fallback?.videoUrl || null,
    ratingAvg: typeof row.ratingAvg === "number" ? row.ratingAvg : Number(row.ratingAvg),
    ratingCount: row.ratingCount,
  };
}

const productSelect = {
  id: true,
  name: true,
  slug: true,
  description: true,
  ogImageKey: true,
  isNew: true,
  ratingAvg: true,
  ratingCount: true,
  primaryCategory: { select: { slug: true, path: true } },
  variants: {
    where: { isActive: true },
    orderBy: { createdAt: "asc" as const },
    take: 1,
    select: {
      sku: true,
      price: true,
      salePrice: true,
      stockOnHand: true,
      stockReserved: true,
    },
  },
  media: {
    orderBy: { sortOrder: "asc" as const },
    select: { type: true, storageKey: true, sortOrder: true },
  },
} as const;

export const listPublishedProducts = cache(async (): Promise<ShowcaseProduct[]> => {
  return remember("published-products", 2_000, async () => {
    try {
      const prisma = getPrisma();
      const rows = await prisma.product.findMany({
        where: { deletedAt: null, status: "published" },
        orderBy: [
          { isNew: "desc" },
          { isFeatured: "desc" },
          { soldCount: "desc" },
          { updatedAt: "desc" },
        ],
        select: productSelect,
      });
      if (rows.length === 0) return [...SHOWCASE_PRODUCTS];
      return rows.map(mapRow);
    } catch {
      return [...SHOWCASE_PRODUCTS];
    }
  });
});

export const getPublishedProduct = cache(
  async (slug: string): Promise<ShowcaseProduct | undefined> => {
    try {
      const prisma = getPrisma();
      const row = await prisma.product.findFirst({
        where: { slug, deletedAt: null, status: "published" },
        select: productSelect,
      });
      if (row) return mapRow(row);
    } catch {
      // fall through
    }
    return showcaseBySlug(slug);
  },
);

export async function productsByCategorySlug(categorySlug: string): Promise<ShowcaseProduct[]> {
  const all = await listPublishedProducts();
  return all.filter((p) => p.categorySlug === categorySlug);
}

export async function searchCatalog(query: string): Promise<ShowcaseProduct[]> {
  const needle = query.trim().toLowerCase();
  const all = await listPublishedProducts();
  if (!needle) return all;
  return all.filter((product) => {
    if (product.categorySlug === needle || product.kind === needle) return true;
    const haystack =
      `${product.name} ${product.sku} ${product.blurb} ${product.categorySlug} ${product.kind}`.toLowerCase();
    return haystack.includes(needle);
  });
}
