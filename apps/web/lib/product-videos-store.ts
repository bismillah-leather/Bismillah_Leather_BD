import { readStoredProductVideos, writeStoredProductVideos, type ProductVideoMap } from "@bismillah/db";
import { isSupportedVideoUrl } from "@bismillah/shared";
import { promises as fs } from "node:fs";
import path from "node:path";

export type { ProductVideoMap };

const DATA_PATH = path.join(process.cwd(), "data", "product-videos.json");

async function readFileMap(): Promise<ProductVideoMap> {
  try {
    const raw = await fs.readFile(DATA_PATH, "utf8");
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    const out: ProductVideoMap = {};
    for (const [slug, value] of Object.entries(parsed as Record<string, unknown>)) {
      if (typeof value === "string" && value.trim()) out[slug] = value.trim();
    }
    return out;
  } catch {
    return {};
  }
}

export async function writeProductVideos(map: ProductVideoMap): Promise<void> {
  await writeStoredProductVideos(map);
  try {
    await fs.mkdir(path.dirname(DATA_PATH), { recursive: true });
    await fs.writeFile(DATA_PATH, `${JSON.stringify(map, null, 2)}\n`, "utf8");
  } catch {
    // Database copy is the one the storefront reads.
  }
}

export async function readProductVideos(): Promise<ProductVideoMap> {
  try {
    const stored = await readStoredProductVideos();
    if (stored) return stored;
  } catch (error) {
    console.error("[web] product video database read failed:", error);
  }
  return readFileMap();
}

export async function videoUrlForSlug(slug: string, fallback?: string | null): Promise<string | null> {
  const map = await readProductVideos();
  const mapped = map[slug]?.trim() || null;
  const fromProduct = fallback?.trim() || null;
  if (mapped && isSupportedVideoUrl(mapped)) return mapped;
  if (fromProduct && isSupportedVideoUrl(fromProduct)) return fromProduct;
  return mapped || fromProduct;
}
