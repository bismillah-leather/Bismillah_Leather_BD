import Redis from "ioredis";

type Bucket = { count: number; resetAt: number };

const globalStore = globalThis as unknown as {
  __blRateBuckets?: Map<string, Bucket>;
  __blCacheRedis?: Redis | null;
  __blCoreRedis?: Redis | null;
};

function memoryBuckets() {
  if (!globalStore.__blRateBuckets) globalStore.__blRateBuckets = new Map();
  return globalStore.__blRateBuckets;
}

function connect(url: string | undefined): Redis | null {
  const trimmed = url?.trim();
  if (!trimmed) return null;
  return new Redis(trimmed, {
    maxRetriesPerRequest: 2,
    enableOfflineQueue: false,
    lazyConnect: false,
  });
}

export function getCacheRedis(): Redis | null {
  if (globalStore.__blCacheRedis !== undefined) return globalStore.__blCacheRedis;
  globalStore.__blCacheRedis = connect(process.env.REDIS_CACHE_URL);
  return globalStore.__blCacheRedis;
}

export function getCoreRedis(): Redis | null {
  if (globalStore.__blCoreRedis !== undefined) return globalStore.__blCoreRedis;
  globalStore.__blCoreRedis = connect(process.env.REDIS_CORE_URL);
  return globalStore.__blCoreRedis;
}

function memoryHit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const map = memoryBuckets();
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

/** Fixed window. Uses Redis when REDIS_CACHE_URL is set so load-balanced replicas share limits. */
export async function hitRateLimit(
  key: string,
  limit: number,
  windowMs: number,
): Promise<{ ok: boolean; remaining: number; retryAfterSec: number }> {
  const redis = getCacheRedis();
  if (!redis) return memoryHit(key, limit, windowMs);

  const redisKey = `rl:${key}`;
  try {
    const count = await redis.incr(redisKey);
    if (count === 1) await redis.pexpire(redisKey, windowMs);
    const ttlMs = await redis.pttl(redisKey);
    const retryAfterSec = Math.max(1, Math.ceil((ttlMs > 0 ? ttlMs : windowMs) / 1000));
    if (count > limit) return { ok: false, remaining: 0, retryAfterSec };
    return { ok: true, remaining: Math.max(0, limit - count), retryAfterSec };
  } catch {
    return memoryHit(key, limit, windowMs);
  }
}

export function clientIp(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || "unknown";
  return headers.get("x-real-ip") ?? "unknown";
}

export async function redisHealth(): Promise<{ cache: boolean; core: boolean }> {
  async function ping(client: Redis | null) {
    if (!client) return false;
    try {
      return (await client.ping()) === "PONG";
    } catch {
      return false;
    }
  }
  const [cache, core] = await Promise.all([ping(getCacheRedis()), ping(getCoreRedis())]);
  return { cache, core };
}
