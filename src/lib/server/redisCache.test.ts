import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

// Mock the Upstash config to return null (use memory fallback)
vi.mock("@/lib/security/upstashRedis", () => ({
  getUpstashConfig: () => null,
}));

import { getCached, invalidateCache } from "./redisCache";

describe("redisCache (memory fallback)", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns cached value on second call", async () => {
    let callCount = 0;
    const result1 = await getCached("test-key", async () => {
      callCount++;
      return { data: "hello" };
    }, 60);

    const result2 = await getCached("test-key", async () => {
      callCount++;
      return { data: "world" };
    }, 60);

    expect(result1.data).toBe("hello");
    expect(result2.data).toBe("hello"); // Should be cached
    expect(callCount).toBe(1); // Fetcher called only once
  });

  it("returns fresh value after TTL expires", async () => {
    let callCount = 0;
    await getCached("ttl-test", async () => {
      callCount++;
      return callCount;
    }, 10);

    vi.advanceTimersByTime(11_000);

    const result = await getCached("ttl-test", async () => {
      callCount++;
      return callCount;
    }, 10);

    expect(result).toBe(2);
    expect(callCount).toBe(2);
  });

  it("invalidateCache removes cached value", async () => {
    let callCount = 0;
    await getCached("invalidate-test", async () => {
      callCount++;
      return "original";
    }, 60);

    await invalidateCache("invalidate-test");

    const result = await getCached("invalidate-test", async () => {
      callCount++;
      return "updated";
    }, 60);

    expect(result).toBe("updated");
    expect(callCount).toBe(2);
  });

  it("different keys are tracked independently", async () => {
    const r1 = await getCached("key-a", async () => "value-a", 60);
    const r2 = await getCached("key-b", async () => "value-b", 60);

    expect(r1).toBe("value-a");
    expect(r2).toBe("value-b");
  });

  it("singleFlight prevents cache stampede", async () => {
    vi.useRealTimers(); // Don't use fake timers for this test
    let callCount = 0;
    const fetcher = async () => {
      callCount++;
      await new Promise((r) => setTimeout(r, 10));
      return "data";
    };

    // Fire multiple concurrent requests for the same key
    const [r1, r2, r3] = await Promise.all([
      getCached("stampede-test", fetcher, 60),
      getCached("stampede-test", fetcher, 60),
      getCached("stampede-test", fetcher, 60),
    ]);

    expect(r1).toBe("data");
    expect(r2).toBe("data");
    expect(r3).toBe("data");
    expect(callCount).toBe(1); // Only one fetcher call
  });
});
