import "server-only";

import { getUpstashConfig, upstashPipeline } from "@/lib/security/upstashRedis";
import { redisCircuitBreaker } from "@/lib/security/circuit-breaker";

// v2: values are stored with `SET key <json> EX <ttl>` (raw-body semantics),
// which applies a real TTL. v1 wrote a `{value, ex}` JSON wrapper verbatim —
// no TTL was applied and reads returned the wrapper itself. Versioning the
// key means stale v1 payloads can never be read again.
function buildRedisKey(key: string): string {
  return `cache:v2:${key}`;
}

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

// ─── Stale cache (served when Redis circuit is open) ──────────────────────

const staleStore = new Map<string, { value: unknown; expiresAt: number }>();
const STALE_MAX_ENTRIES = 200;
const STALE_TTL_SECONDS = 300; // 5 minutes

function staleGet<T>(key: string): T | undefined {
  const entry = staleStore.get(key);
  if (!entry) return undefined;
  if (Date.now() > entry.expiresAt) return undefined;
  return entry.value as T;
}

function staleSet<T>(key: string, value: T): void {
  if (staleStore.size >= STALE_MAX_ENTRIES) {
    const oldest = staleStore.keys().next().value;
    if (oldest) staleStore.delete(oldest);
  }
  staleStore.set(key, {
    value,
    expiresAt: Date.now() + STALE_TTL_SECONDS * 1000,
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
 * Get-or-set cache with automatic TTL, stampede protection, and circuit breaker.
 *
 * - Uses Upstash Redis REST when configured (distributed, persists across processes)
 * - Falls back to an in-memory LRU Map (single-process only)
 * - Circuit breaker: if Redis fails 3 times in 20s, serves stale cache for 15s
 * - `singleFlight` prevents cache stampedes
 *
 * @param key      Cache key (namespaced by caller, e.g. "product:slug:guitar")
 * @param fetcher  Async function that produces the value on cache miss
 * @param ttlSeconds  Time-to-live in seconds
 */
export async function getCached<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlSeconds: number,
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
  ttlSeconds: number,
): Promise<T> {
  const redisKey = buildRedisKey(key);

  // If Redis circuit is open, try stale cache first
  if (!redisCircuitBreaker.isHealthy()) {
    const stale = staleGet<T>(key);
    if (stale !== undefined) {
      // Serve stale, but background-refresh if possible
      singleFlight(key, async () => {
        const value = await fetcher();
        staleSet(key, value);
        return value;
      }).catch(() => {}); // fire-and-forget
      return stale;
    }
    // No stale cache either — fall through to fetcher directly
    return singleFlight(key, async () => {
      const value = await fetcher();
      staleSet(key, value);
      return value;
    });
  }

  // Normal path: try Redis
  try {
    const result = await fetch(`${config.url}/get/${redisKey}`, {
      headers: { Authorization: `Bearer ${config.token}` },
      cache: "no-store",
    });
    if (result.ok) {
      const text = await result.text();
      // Upstash REST answers HTTP 200 with `{"result":null}` for a MISSING
      // key — that is a cache miss, not a hit. Only `result` carrying a real
      // value is treated as a hit, and the stored value is double-encoded
      // (JSON string inside the envelope), so unwrap both layers.
      if (text && text !== "nil") {
        const envelope = JSON.parse(text) as { result?: unknown };
        const raw = envelope?.result;
        if (raw !== null && raw !== undefined) {
          let value: T;
          if (typeof raw === "string") {
            try {
              value = JSON.parse(raw) as T;
            } catch {
              value = raw as T; // legacy plain-string payload
            }
          } else {
            value = raw as T;
          }
          staleSet(key, value); // Keep as stale backup
          redisCircuitBreaker.recordSuccess();
          return value;
        }
      }
    }
  } catch {
    redisCircuitBreaker.recordFailure();
    // Fall through to fetcher
  }

  // Cache miss — fetch with stampede protection
  return singleFlight(key, async () => {
    const value = await fetcher();
    if (value === undefined) return value; // never cache undefined
    staleSet(key, value);

    // Write to Redis (fire-and-forget). Upstash REST treats the request
    // body as the raw value and applies no expiry by itself, so we issue the
    // full `SET key value EX ttl` through the pipeline endpoint (same path
    // the distributed rate limiter already uses).
    upstashPipeline([["SET", redisKey, JSON.stringify(value), "EX", String(ttlSeconds)]])
      .then(() => {
        redisCircuitBreaker.recordSuccess();
      })
      .catch(() => {
        redisCircuitBreaker.recordFailure();
      });

    return value;
  });
}

async function getCachedMemory<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlSeconds: number,
): Promise<T> {
  const hit = memoryGet<T>(key);
  if (hit !== undefined) return hit;

  return singleFlight(key, async () => {
    const value = await fetcher();
    memorySet(key, value, ttlSeconds);
    staleSet(key, value);
    return value;
  });
}

/**
 * Invalidate a cached key (works for both Redis and memory).
 */
export async function invalidateCache(key: string): Promise<void> {
  staleStore.delete(key);
  memoryStore.delete(key);

  const config = getUpstashConfig();
  if (config && redisCircuitBreaker.isHealthy()) {
    try {
      await fetch(`${config.url}/del/${buildRedisKey(key)}`, {
        headers: { Authorization: `Bearer ${config.token}` },
        cache: "no-store",
      });
      redisCircuitBreaker.recordSuccess();
    } catch {
      redisCircuitBreaker.recordFailure();
    }
  }
}

/** Get cache stats for monitoring */
export function getCacheStats(): {
  memoryEntries: number;
  staleEntries: number;
  inflightRequests: number;
} {
  return {
    memoryEntries: memoryStore.size,
    staleEntries: staleStore.size,
    inflightRequests: inflight.size,
  };
}
