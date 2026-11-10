import { Prisma } from "./generated/prisma/client";
import { readJsonSetting, writeJsonSetting } from "./json-setting";
import { promises as fs } from "node:fs";
import path from "node:path";

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
  const stored = asMap(await readJsonSetting(KEY));
  if (stored) return stored;
  const legacy = await readLegacyVideoFile();
  if (!legacy) return null;
  try {
    await writeStoredProductVideos(legacy);
  } catch {
    // File copy is still returned below.
  }
  return legacy;
}

async function readLegacyVideoFile(): Promise<ProductVideoMap | null> {
  const candidates = [
    path.join(process.cwd(), "data", "product-videos.json"),
    path.join(process.cwd(), "../web/data/product-videos.json"),
    path.join(process.cwd(), "../../apps/web/data/product-videos.json"),
  ];
  for (const file of candidates) {
    try {
      const raw = await fs.readFile(file, "utf8");
      const parsed = asMap(JSON.parse(raw) as Prisma.JsonValue);
      if (parsed && Object.keys(parsed).length > 0) return parsed;
    } catch {
      // try the next location
    }
  }
  return null;
}

export async function writeStoredProductVideos(map: ProductVideoMap): Promise<ProductVideoMap> {
  await writeJsonSetting(KEY, map);
  return map;
}
