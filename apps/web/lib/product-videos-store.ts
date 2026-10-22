import { promises as fs } from "node:fs";
import path from "node:path";

/** slug → YouTube / Facebook video URL (empty string clears). */
export type ProductVideoMap = Record<string, string>;

const DATA_PATH = path.join(process.cwd(), "data", "product-videos.json");

export async function writeProductVideos(map: ProductVideoMap): Promise<void> {
  await fs.mkdir(path.dirname(DATA_PATH), { recursive: true });
  await fs.writeFile(DATA_PATH, `${JSON.stringify(map, null, 2)}\n`, "utf8");
}

export async function readProductVideos(): Promise<ProductVideoMap> {
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

export async function videoUrlForSlug(slug: string, fallback?: string | null): Promise<string | null> {
  const map = await readProductVideos();
  if (Object.prototype.hasOwnProperty.call(map, slug)) {
    return map[slug] || null;
  }
  return fallback ?? null;
}
