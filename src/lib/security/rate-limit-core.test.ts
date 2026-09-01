import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { checkRateLimit, getClientIp } from "@/lib/security/rate-limit-core";

describe("getClientIp", () => {
  it("prefers X-Real-IP over spoofable left-most X-Forwarded-For", () => {
    const request = new Request("https://vibemusic.in/api/health", {
      headers: {
        "x-forwarded-for": "1.2.3.4, 10.0.0.1",
        "x-real-ip": "10.0.0.1",
      },
    });
    expect(getClientIp(request)).toBe("10.0.0.1");
  });

  it("uses rightmost forwarded hop when X-Real-IP is absent", () => {
    const request = new Request("https://vibemusic.in/api/health", {
      headers: {
        "x-forwarded-for": "9.9.9.9, 203.0.113.10",
      },
    });
    expect(getClientIp(request)).toBe("203.0.113.10");
  });
});

describe("checkRateLimit", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("allows the first request and returns correct remaining count", () => {
    const result = checkRateLimit("rl-a", { limit: 5, windowMs: 10_000 });

    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(4);
  });

  it("decrements remaining on each request within the window", () => {
    const key = "rl-decrement";

    const r1 = checkRateLimit(key, { limit: 3, windowMs: 10_000 });
    expect(r1.remaining).toBe(2);

    const r2 = checkRateLimit(key, { limit: 3, windowMs: 10_000 });
    expect(r2.remaining).toBe(1);

    const r3 = checkRateLimit(key, { limit: 3, windowMs: 10_000 });
    expect(r3.remaining).toBe(0);
    expect(r3.allowed).toBe(true);
  });

  it("blocks requests that exceed the limit", () => {
    const key = "rl-block";

    for (let i = 0; i < 3; i++) {
      checkRateLimit(key, { limit: 3, windowMs: 10_000 });
    }

    const blocked = checkRateLimit(key, { limit: 3, windowMs: 10_000 });
    expect(blocked.allowed).toBe(false);
    expect(blocked.remaining).toBe(0);
  });

  it("resets the counter after the window expires", () => {
    const key = "rl-reset";
    const windowMs = 5_000;

    // Exhaust the limit
    for (let i = 0; i < 2; i++) {
      checkRateLimit(key, { limit: 2, windowMs });
    }
    const blocked = checkRateLimit(key, { limit: 2, windowMs });
    expect(blocked.allowed).toBe(false);

    // Advance past the window
    vi.advanceTimersByTime(windowMs + 1);

    const renewed = checkRateLimit(key, { limit: 2, windowMs });
    expect(renewed.allowed).toBe(true);
    expect(renewed.remaining).toBe(1);
  });

  it("tracks different keys independently", () => {
    const opts = { limit: 1, windowMs: 10_000 };

    const a1 = checkRateLimit("rl-x", opts);
    expect(a1.allowed).toBe(true);

    const a2 = checkRateLimit("rl-x", opts);
    expect(a2.allowed).toBe(false);

    // Different key should still be allowed
    const b1 = checkRateLimit("rl-y", opts);
    expect(b1.allowed).toBe(true);
    expect(b1.remaining).toBe(0);
  });

  it("returns consistent resetAt timestamp within a window", () => {
    const key = "rl-reset-ts";

    const r1 = checkRateLimit(key, { limit: 5, windowMs: 10_000 });
    const r2 = checkRateLimit(key, { limit: 5, windowMs: 10_000 });
    const r3 = checkRateLimit(key, { limit: 5, windowMs: 10_000 });

    expect(r1.resetAt).toBe(r2.resetAt);
    expect(r2.resetAt).toBe(r3.resetAt);
  });

  it("returns a new resetAt after window expiry", () => {
    const key = "rl-new-window";

    const r1 = checkRateLimit(key, { limit: 5, windowMs: 10_000 });
    vi.advanceTimersByTime(10_001);

    const r2 = checkRateLimit(key, { limit: 5, windowMs: 10_000 });

    expect(r2.resetAt).toBeGreaterThan(r1.resetAt);
  });
});
