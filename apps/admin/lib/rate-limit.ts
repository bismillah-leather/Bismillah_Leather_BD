type Bucket = { count: number; resetAt: number };

const globalStore = globalThis as unknown as {
  __blRateBuckets?: Map<string, Bucket>;
};

function buckets() {
  if (!globalStore.__blRateBuckets) globalStore.__blRateBuckets = new Map();
  return globalStore.__blRateBuckets;
}

/** Sliding fixed window. Returns remaining attempts and whether blocked. */
export function hitRateLimit(
  key: string,
  limit: number,
  windowMs: number,
): { ok: boolean; remaining: number; retryAfterSec: number } {
  const now = Date.now();
  const map = buckets();
  const existing = map.get(key);

  if (!existing || existing.resetAt <= now) {
    map.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: limit - 1, retryAfterSec: Math.ceil(windowMs / 1000) };
  }

  existing.count += 1;
  const retryAfterSec = Math.max(1, Math.ceil((existing.resetAt - now) / 1000));
  if (existing.count > limit) {
    return { ok: false, remaining: 0, retryAfterSec };
  }
  return { ok: true, remaining: limit - existing.count, retryAfterSec };
}

export function clientIp(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || "unknown";
  return headers.get("x-real-ip") ?? "unknown";
}
