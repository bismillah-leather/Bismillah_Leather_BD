const pending = new Map<string, { expires: number; value: Promise<unknown> }>();

export function forget(key: string) {
  pending.delete(key);
}

/** Share one in-flight result across requests for a few seconds. */
export function remember<T>(key: string, ttlMs: number, load: () => Promise<T>): Promise<T> {
  const now = Date.now();
  const hit = pending.get(key);
  if (hit && hit.expires > now) return hit.value as Promise<T>;

  const value = load().catch((error: unknown) => {
    const current = pending.get(key);
    if (current?.value === value) pending.delete(key);
    throw error;
  });
  pending.set(key, { expires: now + ttlMs, value });
  return value;
}
