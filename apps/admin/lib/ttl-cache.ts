type Entry<T> = { expires: number; value: T; inflight?: Promise<T> };

const store = new Map<string, Entry<unknown>>();

export function remember<T>(key: string, ttlMs: number, load: () => Promise<T>): Promise<T> {
  const hit = store.get(key) as Entry<T> | undefined;
  if (hit && hit.expires > Date.now()) return Promise.resolve(hit.value);
  if (hit?.inflight) return hit.inflight;

  const inflight = load()
    .then((value) => {
      store.set(key, { expires: Date.now() + ttlMs, value });
      return value;
    })
    .catch((error) => {
      store.delete(key);
      throw error;
    });

  store.set(key, { expires: 0, value: hit?.value as T, inflight });
  return inflight;
}

export function forgetAdminLists() {
  store.clear();
}
