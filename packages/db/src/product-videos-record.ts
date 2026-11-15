import { Prisma } from "./generated/prisma/client";
import { readJsonSetting, writeJsonSetting } from "./json-setting";

const KEY = "product_videos";

export type ProductVideoMap = Record<string, string>;

function asMap(value: Prisma.JsonValue | null): ProductVideoMap | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const out: ProductVideoMap = {};
  for (const [slug, url] of Object.entries(value)) {
    if (typeof url === "string" && url.trim()) out[slug] = url.trim();
  }
  return out;
}

/** Null when the setting has never been saved. */
export async function readStoredProductVideos(): Promise<ProductVideoMap | null> {
  return asMap(await readJsonSetting(KEY));
}

export async function writeStoredProductVideos(map: ProductVideoMap): Promise<ProductVideoMap> {
  await writeJsonSetting(KEY, map);
  return map;
}
