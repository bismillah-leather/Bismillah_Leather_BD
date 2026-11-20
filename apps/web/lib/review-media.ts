import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { createHash, createHmac } from "node:crypto";
import { loadRootEnv } from "@bismillah/db";

const ALLOWED = new Map([
  ["image/jpeg", "jpg"],
  ["image/jpg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
  ["image/gif", "gif"],
]);

export const REVIEW_PHOTO_MAX_BYTES = 5 * 1024 * 1024;
export const REVIEW_PHOTO_MAX_COUNT = 4;

export function reviewImageExt(file: { type: string; name: string }) {
  const fromType = ALLOWED.get(file.type);
  if (fromType) return fromType;
  const match = file.name.toLowerCase().match(/\.(jpe?g|png|webp|gif)$/);
  if (!match) return null;
  return match[1] === "jpeg" ? "jpg" : match[1];
}

function readR2() {
  loadRootEnv();
  const accountId = process.env.R2_ACCOUNT_ID?.trim();
  const accessKeyId = process.env.R2_ACCESS_KEY_ID?.trim();
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY?.trim();
  const bucket = process.env.R2_BUCKET?.trim();
  const publicBase = process.env.R2_PUBLIC_URL?.trim().replace(/\/$/, "");
  if (!accountId || !accessKeyId || !secretAccessKey || !bucket || !publicBase) return null;
  return { accountId, accessKeyId, secretAccessKey, bucket, publicBase };
}

function sha256Hex(data: Buffer | string) {
  return createHash("sha256").update(data).digest("hex");
}

async function putR2(key: string, body: Buffer, contentType: string) {
  const config = readR2();
  if (!config) throw new Error("R2 is not configured.");
  const host = `${config.accountId}.r2.cloudflarestorage.com`;
  const encodedKey = key
    .split("/")
    .filter(Boolean)
    .map((part) => encodeURIComponent(part))
    .join("/");
  const canonicalUri = `/${config.bucket}/${encodedKey}`;
  const amzDate = new Date().toISOString().replace(/[:-]|\.\d{3}/g, "");
  const dateStamp = amzDate.slice(0, 8);
  const payloadHash = sha256Hex(body);
  const canonicalHeaders = [
    `content-type:${contentType}`,
    `host:${host}`,
    `x-amz-content-sha256:${payloadHash}`,
    `x-amz-date:${amzDate}`,
    "",
  ].join("\n");
  const signedHeaders = "content-type;host;x-amz-content-sha256;x-amz-date";
  const canonicalRequest = ["PUT", canonicalUri, "", canonicalHeaders, signedHeaders, payloadHash].join("\n");
  const scope = `${dateStamp}/auto/s3/aws4_request`;
  const stringToSign = ["AWS4-HMAC-SHA256", amzDate, scope, sha256Hex(canonicalRequest)].join("\n");
  const hmac = (key: Buffer | string, data: string) => createHmac("sha256", key).update(data).digest();
  const signingKey = hmac(hmac(hmac(hmac(`AWS4${config.secretAccessKey}`, dateStamp), "auto"), "s3"), "aws4_request");
  const signature = createHmac("sha256", signingKey).update(stringToSign).digest("hex");
  const response = await fetch(`https://${host}${canonicalUri}`, {
    method: "PUT",
    headers: {
      "content-type": contentType,
      "x-amz-content-sha256": payloadHash,
      "x-amz-date": amzDate,
      authorization: `AWS4-HMAC-SHA256 Credential=${config.accessKeyId}/${scope}, SignedHeaders=${signedHeaders}, Signature=${signature}`,
    },
    body: new Uint8Array(body),
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) throw new Error(`R2 upload failed (${response.status}).`);
  return `${config.publicBase}/${encodedKey}`;
}

function saveLocal(key: string, bytes: Buffer) {
  const root = path.resolve(process.cwd(), "public", "uploads");
  const parts = key.split("/").filter((part) => part && part !== "." && part !== "..");
  const file = path.resolve(root, ...parts);
  if (!file.startsWith(root + path.sep)) throw new Error("Bad image name.");
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(file, bytes);
  return `/uploads/${parts.join("/")}`;
}

export async function storeReviewPhoto(key: string, bytes: Buffer, contentType: string) {
  if (readR2()) return putR2(key, bytes, contentType);
  if (process.env.VERCEL === "1" || process.env.VERCEL_ENV) {
    throw new Error("Image hosting is not set up yet.");
  }
  if (!existsSync(path.join(process.cwd(), "public"))) {
    throw new Error("Could not store the photo.");
  }
  return saveLocal(key, bytes);
}
