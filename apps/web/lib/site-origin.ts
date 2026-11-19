import { loadRootEnv } from "@bismillah/db";
import { originFromProxyHeaders } from "@bismillah/shared";
import { headers } from "next/headers";

export async function publicStoreOrigin() {
  loadRootEnv();
  const configured = process.env.NEXT_PUBLIC_STORE_URL?.trim().replace(/\/$/, "");
  if (configured) return configured;
  try {
    const requestHeaders = await headers();
    return originFromProxyHeaders((name) => requestHeaders.get(name), "http://localhost:3000");
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
