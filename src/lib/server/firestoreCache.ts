import "server-only";

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

export interface FirestoreCacheOptions {
  ttlMs?: number;
  maxEntries?: number;
  namespace?: string;
}

const DEFAULT_TTL_MS =
  Number(process.env.FIRESTORE_CACHE_TTL_MS) ||
  (process.env.NODE_ENV === "production" ? 300_000 : 90_000);

const DEFAULT_MAX_ENTRIES = 500;

const stores = new Map<string, Map<string, CacheEntry<unknown>>>();

const accessLog = new Map<string, number>();

function getStore(namespace: string): Map<string, CacheEntry<unknown>> {
  let store = stores.get(namespace);
  if (!store) {
    store = new Map();
    stores.set(namespace, store);
  }
  return store;
}

function evictLRU(store: Map<string, CacheEntry<unknown>>, max: number): void {
  if (store.size <= max) return;

  const entries = [...store.entries()]
    .map(([key, entry]) => ({ key, entry, accessed: accessLog.get(key) ?? 0 }))
    .sort((a, b) => a.accessed - b.accessed);

  const toRemove = store.size - max;
  for (let i = 0; i < toRemove && i < entries.length; i++) {
    store.delete(entries[i].key);
    accessLog.delete(entries[i].key);
  }
}

export function createFirestoreCache<T>(options: FirestoreCacheOptions = {}) {
  const {
    ttlMs = DEFAULT_TTL_MS,
    maxEntries = DEFAULT_MAX_ENTRIES,
    namespace = "default",
  } = options;

  const store = getStore(namespace);

  return {
    get(key: string): T | undefined {
      const entry = store.get(key);
      if (!entry) return undefined;

      accessLog.set(key, Date.now());

      if (Date.now() >= entry.expiresAt) {
        store.delete(key);
        accessLog.delete(key);
        return undefined;
      }

      return entry.value as T;
    },

    set(key: string, value: T, customTtl?: number): void {
      store.set(key, {
        value,
        expiresAt: Date.now() + (customTtl ?? ttlMs),
      });
      accessLog.set(key, Date.now());
      evictLRU(store, maxEntries);
    },

    has(key: string): boolean {
      const entry = store.get(key);
      if (!entry) return false;
      if (Date.now() >= entry.expiresAt) {
        store.delete(key);
        accessLog.delete(key);
        return false;
      }
      return true;
    },

    delete(key: string): void {
      store.delete(key);
      accessLog.delete(key);
    },

    clear(): void {
      store.clear();
      accessLog.clear();
    },

    get size(): number {
      return store.size;
    },

    entries(): Array<{ key: string; value: T }> {
      const now = Date.now();
      const result: Array<{ key: string; value: T }> = [];
      for (const [key, entry] of store) {
        if (now < entry.expiresAt) {
          result.push({ key, value: entry.value as T });
        }
      }
      return result;
    },
  };
}

export function clearAllFirestoreCaches(): void {
  stores.clear();
  accessLog.clear();
}
