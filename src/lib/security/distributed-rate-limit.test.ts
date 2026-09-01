import { describe, expect, it, vi, beforeEach } from "vitest";

// Mock Upstash to use in-memory fallback
vi.mock("@/lib/security/upstashRedis", () => ({
  getUpstashConfig: () => null,
  upstashPipeline: vi.fn(),
}));

import { distributedCheckRateLimit } from "./distributed-rate-limit";

describe("distributedCheckRateLimit (memory fallback)", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // Each test starts at a clean state since the in-memory buckets reset per window
  });

  it("allows first request", async () => {
    const result = await distributedCheckRateLimit("test-key", {
      limit: 5,
      windowMs: 60_000,
    });
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(4);
  });

  it("tracks remaining count", async () => {
    const key = "count-test";
    const opts = { limit: 3, windowMs: 60_000 };

    const r1 = await distributedCheckRateLimit(key, opts);
    expect(r1.remaining).toBe(2);

    const r2 = await distributedCheckRateLimit(key, opts);
    expect(r2.remaining).toBe(1);

    const r3 = await distributedCheckRateLimit(key, opts);
    expect(r3.remaining).toBe(0);
  });

  it("blocks after limit exceeded", async () => {
    const key = "block-test";
    const opts = { limit: 2, windowMs: 60_000 };

    await distributedCheckRateLimit(key, opts);
    await distributedCheckRateLimit(key, opts);

    const blocked = await distributedCheckRateLimit(key, opts);
    expect(blocked.allowed).toBe(false);
    expect(blocked.remaining).toBe(0);
  });

  it("resets after window expires", async () => {
    const key = "window-test";
    const opts = { limit: 1, windowMs: 60_000 };

    await distributedCheckRateLimit(key, opts);

    const blocked = await distributedCheckRateLimit(key, opts);
    expect(blocked.allowed).toBe(false);

    // Advance past window
    vi.advanceTimersByTime(61_000);

    const allowed = await distributedCheckRateLimit(key, opts);
    expect(allowed.allowed).toBe(true);
  });

  it("independent keys", async () => {
    const opts = { limit: 1, windowMs: 60_000 };

    const r1 = await distributedCheckRateLimit("key-a", opts);
    expect(r1.allowed).toBe(true);

    const r2 = await distributedCheckRateLimit("key-b", opts);
    expect(r2.allowed).toBe(true);

    const r3 = await distributedCheckRateLimit("key-a", opts);
    expect(r3.allowed).toBe(false);
  });
});
