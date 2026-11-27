import { loadRootEnv } from "@bismillah/db";
import { originFromProxyHeaders } from "@bismillah/shared";
import { headers } from "next/headers";

export function normalizeStoreOrigin(raw: string) {
  try {
    const url = new URL(raw);
    url.hostname = url.hostname.replace(/^www\./i, "").toLowerCase();
    if (url.hostname === "bismillahletherbd.com") url.hostname = "bismillahleatherbd.com";
    return url.origin.replace(/\/$/, "");
  } catch {
    return raw.replace(/\/$/, "");
  }
}

export async function publicStoreOrigin() {
  loadRootEnv();
  const configured = process.env.NEXT_PUBLIC_STORE_URL?.trim().replace(/\/$/, "");
  if (configured) return normalizeStoreOrigin(configured);
  try {
    const requestHeaders = await headers();
    return normalizeStoreOrigin(
      originFromProxyHeaders((name) => requestHeaders.get(name), "http://localhost:3000"),
    );
  } catch {
    return "http://localhost:3000";
  }
}

export function absoluteUrl(origin: string, path: string) {
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  const base = origin.replace(/\/$/, "");
  const next = path.startsWith("/") ? path : `/${path}`;
  return `${base}${next}`;
}
