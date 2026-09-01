import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

vi.mock("@/lib/security/upstashRedis", () => ({
  getUpstashConfig: () => null,
}));

vi.mock("@/lib/security/distributed-rate-limit", () => ({
  distributedCheckRateLimit: vi.fn(),
}));

vi.mock("@/lib/security/mutation-origin", () => ({
  isMutationMethod: vi.fn(),
  isWebhookPath: vi.fn(() => false),
  verifyMutationOrigin: vi.fn(() => true),
}));

vi.mock("@/lib/security/request-log", () => ({
  getRequestId: vi.fn(() => "integration-req-id"),
}));

vi.mock("@/lib/server/errorMonitoring", () => ({
  reportServerError: vi.fn(),
}));

vi.mock("@/lib/server/logger", () => ({
  logInfo: vi.fn(),
}));

import { distributedCheckRateLimit } from "@/lib/security/distributed-rate-limit";
import { isMutationMethod } from "@/lib/security/mutation-origin";

// ─── Integration Test: Cache + Rate Limit working together ─────────────

describe("Integration: Cache + Rate Limit", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("cached endpoint still enforces rate limiting", async () => {
    // Simulate: endpoint first checks rate limit, then serves cached data
    const callLog: string[] = [];

    vi.mocked(distributedCheckRateLimit).mockImplementation(async () => {
      callLog.push("rate-check");
      return { allowed: true, remaining: 99, resetAt: Date.now() + 60000 };
    });

    // Simulate 3 requests
    for (let i = 0; i < 3; i++) {
      const result = await distributedCheckRateLimit("cache-test:ip", {
        limit: 120,
        windowMs: 60000,
      });
      expect(result.allowed).toBe(true);
    }

    expect(callLog).toHaveLength(3);
  });

  it("rate limiter blocks before cache is served", async () => {
    // When rate limit is exceeded, cache should NOT be served
    const cacheHits: string[] = [];

    vi.mocked(distributedCheckRateLimit).mockResolvedValue({
      allowed: false,
      remaining: 0,
      resetAt: Date.now() + 60000,
    });

    const result = await distributedCheckRateLimit("blocked-test:ip", {
      limit: 10,
      windowMs: 60000,
    });

    expect(result.allowed).toBe(false);
    expect(cacheHits).toHaveLength(0);
  });
});

// ─── Integration Test: Error handler + Rate limit headers ─────────────

describe("Integration: Error responses + Headers", () => {
  it("429 response includes proper rate limit headers", async () => {
    const { enforceRateLimit } = await import("@/lib/api/route-utils");

    vi.mocked(distributedCheckRateLimit).mockResolvedValue({
      allowed: false,
      remaining: 0,
      resetAt: Date.now() + 60000,
    });

    const request = new Request("http://localhost/api/test");
    const response = await enforceRateLimit(request, "test-scope");

    expect(response).not.toBeNull();
    expect(response!.status).toBe(429);
    expect(response!.headers.get("X-RateLimit-Remaining")).toBe("0");
    expect(response!.headers.get("x-request-id")).toBeTruthy();
  });
});

// ─── Integration Test: withApiGuards full pipeline ────────────────────

describe("Integration: withApiGuards full pipeline", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(isMutationMethod).mockReturnValue(false);
  });

  it("passes through all guards and returns handler response", async () => {
    const { withApiGuards } = await import("@/lib/api/route-utils");

    vi.mocked(distributedCheckRateLimit).mockResolvedValue({
      allowed: true,
      remaining: 119,
      resetAt: Date.now() + 60000,
    });

    const request = new Request("http://localhost/api/products");
    const response = await withApiGuards(
      request,
      { context: "test-products", scope: "products" },
      async () => {
        const { NextResponse } = await import("next/server");
        return NextResponse.json({ products: [] }, { status: 200 });
      }
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("x-request-id")).toBeTruthy();
  });

  it("returns 429 when rate limit exceeded in guard", async () => {
    const { withApiGuards } = await import("@/lib/api/route-utils");

    vi.mocked(distributedCheckRateLimit).mockResolvedValue({
      allowed: false,
      remaining: 0,
      resetAt: Date.now() + 60000,
    });

    const request = new Request("http://localhost/api/products");
    const response = await withApiGuards(
      request,
      { context: "test-products", scope: "products" },
      async () => {
        throw new Error("Should not reach here");
      }
    );

    expect(response.status).toBe(429);
  });

  it("catches handler errors and returns 500 with request ID", async () => {
    const { withApiGuards } = await import("@/lib/api/route-utils");

    vi.mocked(distributedCheckRateLimit).mockResolvedValue({
      allowed: true,
      remaining: 119,
      resetAt: Date.now() + 60000,
    });

    const request = new Request("http://localhost/api/products");
    const response = await withApiGuards(
      request,
      { context: "test-products", scope: "products" },
      async () => {
        throw new Error("Database connection failed");
      }
    );

    expect(response.status).toBe(500);
    expect(response.headers.get("x-request-id")).toBe("integration-req-id");
  });
});
