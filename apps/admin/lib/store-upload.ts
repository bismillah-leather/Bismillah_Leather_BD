import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { putR2Object, readR2Config } from "./r2";

const ALLOWED = new Map([
  ["image/jpeg", "jpg"],
  ["image/jpg", "jpg"],
  ["image/pjpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
  ["image/avif", "avif"],
  ["image/gif", "gif"],
]);

export function imageExtension(file: { type: string; name: string }) {
  const fromType = ALLOWED.get(file.type);
  if (fromType) return fromType;
  const match = file.name.toLowerCase().match(/\.(jpe?g|png|webp|avif|gif)$/);
  if (!match) return null;
  return match[1] === "jpeg" ? "jpg" : match[1];
}

function webPublicDir() {
  const candidates = [
    path.join(process.cwd(), "../web/public"),
    path.join(process.cwd(), "apps/web/public"),
    path.join(process.cwd(), "../../apps/web/public"),
  ];
  return candidates.find((dir) => existsSync(path.join(dir, "catalog"))) ?? candidates[0]!;
}

function saveLocalShopImage(key: string, bytes: Buffer) {
  const parts = key.split("/").filter((part) => part && part !== "." && part !== ".." && !part.includes("\\"));
  if (parts.length === 0) throw new Error("Bad image name.");
  const root = path.resolve(webPublicDir(), "uploads");
  const file = path.resolve(root, ...parts);
  if (!file.startsWith(root + path.sep)) throw new Error("Bad image name.");
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(file, bytes);
  return `/uploads/${parts.join("/")}`;
}

/** Store a photo on R2 when it is configured, otherwise in the shop's public uploads folder. */
export async function storeUploadedImage(key: string, bytes: Buffer, contentType: string) {
  if (readR2Config()) return putR2Object(key, bytes, contentType);
  if (process.env.NODE_ENV === "production" || process.env.VERCEL === "1" || process.env.VERCEL_ENV) {
    throw new Error("Image hosting is not set up yet. Add the R2 keys.");
  }
  return saveLocalShopImage(key, bytes);
}
