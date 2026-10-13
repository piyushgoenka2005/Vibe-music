import { beforeEach, describe, expect, it, vi } from "vitest";

// Memory-path tests: Upstash is never configured, so getCached uses the
// in-memory store. The circuit breaker is real but unused without config.
vi.mock("@/lib/security/upstashRedis", () => ({
  getUpstashConfig: () => null,
  upstashPipeline: vi.fn(async () => []),
}));

type RedisCacheModule = typeof import("./redisCache");

async function loadRedisCache(): Promise<RedisCacheModule> {
  vi.resetModules();
  return import("./redisCache");
}

/** Deferred so tests can hold a fetch in flight across an invalidation. */
function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((r) => {
    resolve = r;
  });
  return { promise, resolve };
}

describe("redisCache invalidation vs in-flight fetches", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("a fetch that started before invalidateCache never repopulates any store", async () => {
    const { getCached, invalidateCache } = await loadRedisCache();
    const key = "test:settings";
    const slow = deferred<string>();

    // Pre-write read starts and hangs while the admin save commits.
    const preWrite = getCached(key, () => slow.promise, 300);
    await invalidateCache(key);
    slow.resolve("old-value");
    await expect(preWrite).resolves.toBe("old-value");

    // Next read after the write must hit the fetcher, not the poisoned entry.
    const fresh = await getCached(key, async () => "new-value", 300);
    expect(fresh).toBe("new-value");

    // And the cached copy must also be the new value once resolved.
    const cached = await getCached(key, async () => "should-not-run", 300);
    expect(cached).toBe("new-value");
  });

  it("invalidateCache drops the in-flight entry so the next read starts a fresh fetch", async () => {
    const { getCached, invalidateCache } = await loadRedisCache();
    const key = "test:product";
    const first = deferred<string>();
    let fetchCount = 0;

    const pending = getCached(
      key,
      () => {
        fetchCount += 1;
        return first.promise;
      },
      60,
    );
    void pending; // still in flight

    await invalidateCache(key);

    const second = await getCached(
      key,
      async () => {
        fetchCount += 1;
        return "fresh";
      },
      60,
    );

    expect(second).toBe("fresh");
    expect(fetchCount).toBe(2); // invalidated read did NOT join the stale promise

    first.resolve("stale");
    await pending; // let the abandoned fetch settle without side effects

    // The abandoned fetch must not have overwritten the fresh cached value.
    const after = await getCached(key, async () => "should-not-run", 60);
    expect(after).toBe("fresh");
  });

  it("invalidateCacheByPrefix blocks in-flight prefix fetches from caching", async () => {
    const { getCached, invalidateCacheByPrefix } = await loadRedisCache();
    const key = "products:slug:guitar";
    const slow = deferred<string>();

    const pending = getCached(key, () => slow.promise, 60);
    await invalidateCacheByPrefix("products");
    slow.resolve("old");
    await expect(pending).resolves.toBe("old");

    const fresh = await getCached(key, async () => "new", 60);
    expect(fresh).toBe("new");
  });

  it("unrelated invalidations do not block other keys' fetches from caching", async () => {
    const { getCached, invalidateCache } = await loadRedisCache();
    const key = "test:unrelated";
    const slow = deferred<string>();

    const pending = getCached(key, () => slow.promise, 60);
    await invalidateCache("test:some-other-key");
    slow.resolve("value");
    await expect(pending).resolves.toBe("value");

    // This key was NOT invalidated — its fetch result stays cached.
    const cached = await getCached(key, async () => "should-not-run", 60);
    expect(cached).toBe("value");
  });
});
