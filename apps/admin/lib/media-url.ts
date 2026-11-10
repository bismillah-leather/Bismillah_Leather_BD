import { getPrisma } from "@bismillah/db";
import { originFromProxyHeaders, storefrontOriginFrom } from "@bismillah/shared";
import { headers } from "next/headers";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { putR2Object, readR2Config } from "./r2";

const MIME: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  avif: "image/avif",
  gif: "image/gif",
};

/** Storefront origin for this request. Same public host in production. */
export async function requestStoreOrigin() {
  const configured = process.env.NEXT_PUBLIC_STORE_URL?.replace(/\/$/, "");
  if (configured) return storefrontOriginFrom(configured);
  try {
    const h = await headers();
    const host = h.get("x-forwarded-host") || h.get("host");
    if (!host) return "";
    return storefrontOriginFrom(originFromProxyHeaders((name) => h.get(name), `http://${host}`));
  } catch {
    return "";
  }
}

/** Browser URL for a stored image. Local catalog paths load from the storefront. */
export function adminMediaSrc(storageKey: string | null | undefined, origin?: string | null) {
  if (!storageKey) return null;
  if (/^https?:\/\//i.test(storageKey)) return storageKey;
  if (storageKey.startsWith("/")) {
    const base = origin?.replace(/\/$/, "");
    return base ? `${base}${storageKey}` : storageKey;
  }
  return storageKey;
}

function webCatalogRoot() {
  const fallback = path.join(process.cwd(), "../web/public");
  const candidates = [
    fallback,
    path.join(process.cwd(), "apps/web/public"),
    path.join(process.cwd(), "../../apps/web/public"),
  ];
  return candidates.find((dir) => existsSync(path.join(dir, "catalog"))) ?? fallback;
}

function safeCatalogFile(storageKey: string) {
  if (!storageKey.startsWith("/catalog/")) return null;
  const root = webCatalogRoot();
  const file = path.resolve(root, `.${storageKey}`);
  const catalog = path.resolve(root, "catalog");
  if (!file.startsWith(catalog + path.sep)) return null;
  if (!existsSync(file)) return null;
  return file;
}

/** Push existing /catalog files up to R2 and rewrite product media to the public URL. */
export async function syncCatalogImagesToR2() {
  if (!readR2Config()) return { uploaded: 0, configured: false };

  const prisma = getPrisma();
  const rows = await prisma.productMedia.findMany({
    where: { type: "image", storageKey: { startsWith: "/catalog/" } },
    select: { id: true, productId: true, storageKey: true },
    take: 80,
  });

  let uploaded = 0;
  for (const row of rows) {
    const file = safeCatalogFile(row.storageKey);
    if (!file) continue;
    const ext = path.extname(file).slice(1).toLowerCase() || "jpg";
    const contentType = MIME[ext] ?? "image/jpeg";
    const key = `catalog/${path.basename(file)}`;
    try {
      const url = await putR2Object(key, readFileSync(file), contentType);
      await prisma.productMedia.update({
        where: { id: row.id },
        data: { storageKey: url, processingStatus: "ready" },
      });
      await prisma.product.updateMany({
        where: { id: row.productId, ogImageKey: row.storageKey },
        data: { ogImageKey: url },
      });
      uploaded += 1;
    } catch (error) {
      console.error("[admin] catalog image sync failed:", row.storageKey, error);
      break;
    }
  }

  return { uploaded, configured: true };
}
