/** First value of a comma-separated proxy header. */
function firstHeader(value: string | null | undefined) {
  return value?.split(",")[0]?.trim() ?? "";
}

export function isLoopbackHost(host: string) {
  const name = host.replace(/^\[|\]$/g, "").split(":")[0]?.toLowerCase() ?? "";
  return name === "localhost" || name === "127.0.0.1" || name === "0.0.0.0" || name === "::1";
}

/**
 * Browser-facing origin. Prefer a public forwarded host over the internal
 * bind address (often localhost behind a reverse proxy).
 */
export function originFromProxyHeaders(
  get: (name: string) => string | null | undefined,
  fallbackOrigin: string,
): string {
  const forwardedHost = firstHeader(get("x-forwarded-host"));
  const host = firstHeader(get("host"));
  let proto = "https";
  try {
    proto = firstHeader(get("x-forwarded-proto")) || new URL(fallbackOrigin).protocol.replace(":", "");
  } catch {
    proto = firstHeader(get("x-forwarded-proto")) || "https";
  }
  const publicHost = [forwardedHost, host].find((value) => value && !isLoopbackHost(value));
  const chosen = publicHost || forwardedHost || host;
  if (!chosen) return fallbackOrigin;
  return `${proto}://${chosen}`;
}

/** Local admin (:3001) serves the storefront from :3000. Other hosts stay as-is. */
export function storefrontOriginFrom(origin: string) {
  try {
    const url = new URL(origin);
    if (isLoopbackHost(url.hostname) && url.port === "3001") {
      url.port = "3000";
    }
    return url.origin;
  } catch {
    return origin;
  }
}
