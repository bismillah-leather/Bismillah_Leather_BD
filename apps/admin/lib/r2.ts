import { createHash, createHmac } from "node:crypto";
import { loadRootEnv } from "@bismillah/db";

export type R2Config = {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
  publicBase: string;
};

const R2_ENV_NAMES = [
  "R2_ACCOUNT_ID",
  "R2_ACCESS_KEY_ID",
  "R2_SECRET_ACCESS_KEY",
  "R2_BUCKET",
  "R2_PUBLIC_URL",
] as const;

function envTrim(name: string) {
  // Dynamic lookup so Next.js cannot inline empty values from image build time.
  const value = process.env[name];
  return typeof value === "string" ? value.trim() : "";
}

export function missingR2EnvNames() {
  loadRootEnv();
  return R2_ENV_NAMES.filter((name) => !envTrim(name));
}

export function isUsableR2PublicBase(publicBase: string) {
  try {
    const parsed = new URL(publicBase);
    if (parsed.protocol !== "https:") return false;
    const host = parsed.hostname.toLowerCase();
    if (host.includes("cloudflarestorage.com")) return false;
    return host.endsWith(".r2.dev") || host.includes(".");
  } catch {
    return false;
  }
}

export function readR2Config(): R2Config | null {
  if (missingR2EnvNames().length > 0) return null;
  return {
    accountId: envTrim("R2_ACCOUNT_ID"),
    accessKeyId: envTrim("R2_ACCESS_KEY_ID"),
    secretAccessKey: envTrim("R2_SECRET_ACCESS_KEY"),
    bucket: envTrim("R2_BUCKET"),
    publicBase: envTrim("R2_PUBLIC_URL").replace(/\/$/, ""),
  };
}

function sha256Hex(data: Buffer | string) {
  return createHash("sha256").update(data).digest("hex");
}

function hmac(key: Buffer | string, data: string) {
  return createHmac("sha256", key).update(data).digest();
}

function amzTimestamp(now = new Date()) {
  return now.toISOString().replace(/[:-]|\.\d{3}/g, "");
}

/** Upload one object to Cloudflare R2 and return its public URL. */
export async function putR2Object(key: string, body: Buffer, contentType: string) {
  const config = readR2Config();
  if (!config) {
    throw new Error("Image hosting is not set up yet. Add the R2 keys.");
  }
  if (!isUsableR2PublicBase(config.publicBase)) {
    throw new Error("R2_PUBLIC_URL must be the public r2.dev URL, not the S3 or catalog endpoint.");
  }

  const host = `${config.accountId}.r2.cloudflarestorage.com`;
  const encodedKey = key
    .split("/")
    .filter(Boolean)
    .map((part) => encodeURIComponent(part))
    .join("/");
  const canonicalUri = `/${config.bucket}/${encodedKey}`;
  const amzDate = amzTimestamp();
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
  const canonicalRequest = [
    "PUT",
    canonicalUri,
    "",
    canonicalHeaders,
    signedHeaders,
    payloadHash,
  ].join("\n");
  const scope = `${dateStamp}/auto/s3/aws4_request`;
  const stringToSign = ["AWS4-HMAC-SHA256", amzDate, scope, sha256Hex(canonicalRequest)].join("\n");
  const signingKey = hmac(hmac(hmac(hmac(`AWS4${config.secretAccessKey}`, dateStamp), "auto"), "s3"), "aws4_request");
  const signature = createHmac("sha256", signingKey).update(stringToSign).digest("hex");
  const authorization = `AWS4-HMAC-SHA256 Credential=${config.accessKeyId}/${scope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

  const response = await fetch(`https://${host}${canonicalUri}`, {
    method: "PUT",
    headers: {
      "content-type": contentType,
      "x-amz-content-sha256": payloadHash,
      "x-amz-date": amzDate,
      authorization,
    },
    body: new Uint8Array(body),
    signal: AbortSignal.timeout(15_000),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`R2 upload failed (${response.status}). ${detail.slice(0, 180)}`);
  }

  return `${config.publicBase}/${encodedKey}`;
}
