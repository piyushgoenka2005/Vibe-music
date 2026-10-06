import { afterEach, describe, expect, it, vi } from "vitest";
import {
  rateLimitBackendFailureResult,
  shouldFailClosedOnRateLimitBackendError,
} from "@/lib/security/rate-limit-fallback";

describe("rate-limit-fallback", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("fails closed in production when Upstash is configured", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "https://example.upstash.io");
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "token");
    expect(shouldFailClosedOnRateLimitBackendError()).toBe(true);
  });

  it("allows in-memory fallback in development", () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "https://example.upstash.io");
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "token");
    expect(shouldFailClosedOnRateLimitBackendError()).toBe(false);
  });

  it("returns a denied result with zero remaining", () => {
    const result = rateLimitBackendFailureResult({ limit: 10, windowMs: 60_000 });
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
    expect(result.resetAt).toBeGreaterThan(Date.now());
  });
});
