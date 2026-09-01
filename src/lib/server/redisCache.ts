import "server-only";

import { getUpstashConfig } from "@/lib/security/upstashRedis";

// ─── In-memory LRU fallback (when Upstash is not configured) ──────────────

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

const memoryStore = new Map<string, CacheEntry<unknown>>();
const MEMORY_MAX_ENTRIES = 500;

function memoryGet<T>(key: string): T | undefined {
  const entry = memoryStore.get(key);
  if (!entry) return undefined;
  if (Date.now() > entry.expiresAt) {
    memoryStore.delete(key);
    return undefined;
  }
  return entry.value as T;
}

function memorySet<T>(key: string, value: T, ttlSeconds: number): void {
  // Evict oldest entries when at capacity
  if (memoryStore.size >= MEMORY_MAX_ENTRIES) {
    const oldest = memoryStore.keys().next().value;
    if (oldest) memoryStore.delete(oldest);
  }
  memoryStore.set(key, {
    value,
    expiresAt: Date.now() + ttlSeconds * 1000,
  });
}

// ─── Single-flight stampede protection ─────────────────────────────────────

const inflight = new Map<string, Promise<unknown>>();

async function singleFlight<T>(key: string, fn: () => Promise<T>): Promise<T> {
  const existing = inflight.get(key);
  if (existing) return existing as T;

  const promise = fn().finally(() => inflight.delete(key));
  inflight.set(key, promise);
  return promise;
}

// ─── Public API ────────────────────────────────────────────────────────────

/**
 * Get-or-set cache with automatic TTL and stampede protection.
 *
 * - Uses Upstash Redis REST when configured (distributed, persists across processes)
 * - Falls back to an in-memory LRU Map (single-process only)
 * - `singleFlight` prevents cache stampedes: concurrent callers for the same key
 *   share a single in-flight fetch rather than all hitting the DB.
 *
 * @param key      Cache key (namespaced by caller, e.g. "product:slug:guitar")
 * @param fetcher  Async function that produces the value on cache miss
 * @param ttlSeconds  Time-to-live in seconds
 */
export async function getCached<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlSeconds: number
): Promise<T> {
  const config = getUpstashConfig();

  if (config) {
    return getCachedRedis<T>(config, key, fetcher, ttlSeconds);
  }

  return getCachedMemory<T>(key, fetcher, ttlSeconds);
}

async function getCachedRedis<T>(
  config: { url: string; token: string },
  key: string,
  fetcher: () => Promise<T>,
  ttlSeconds: number
): Promise<T> {
  const redisKey = `cache:${key}`;

  // Try reading from Redis first
  try {
    const result = await fetch(`${config.url}/get/${redisKey}`, {
      headers: { Authorization: `Bearer ${config.token}` },
      cache: "no-store",
    });
    if (result.ok) {
      const text = await result.text();
      if (text && text !== "nil") {
        return JSON.parse(text) as T;
      }
    }
  } catch {
    // Fall through to fetcher
  }

  // Cache miss — fetch with stampede protection
  return singleFlight(key, async () => {
    const value = await fetcher();

    // Write to Redis (fire-and-forget, don't block on failure)
    fetch(`${config.url}/set/${redisKey}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ value: JSON.stringify(value), ex: ttlSeconds }),
      cache: "no-store",
    }).catch(() => {
      /* Redis write failure is non-fatal */
    });

    return value;
  });
}

async function getCachedMemory<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlSeconds: number
): Promise<T> {
  const hit = memoryGet<T>(key);
  if (hit !== undefined) return hit;

  return singleFlight(key, async () => {
    const value = await fetcher();
    memorySet(key, value, ttlSeconds);
    return value;
  });
}

/**
 * Invalidate a cached key (works for both Redis and memory).
 */
export async function invalidateCache(key: string): Promise<void> {
  const config = getUpstashConfig();
  if (config) {
    try {
      await fetch(`${config.url}/del/cache:${key}`, {
        headers: { Authorization: `Bearer ${config.token}` },
        cache: "no-store",
      });
    } catch {
      /* non-fatal */
    }
  }
  memoryStore.delete(key);
}
