import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/security/edge-rate-limit", () => ({
  edgeCheckRateLimit: vi.fn(),
}));

import { edgeCheckRateLimit } from "@/lib/security/edge-rate-limit";
import { proxy } from "@/proxy";

function apiRequest(
  pathname: string,
  init?: { method?: string; headers?: Record<string, string> },
): NextRequest {
  const url = `https://vibemusic.in${pathname}`;
  return new NextRequest(url, {
    method: init?.method ?? "GET",
    headers: init?.headers ?? {},
  });
}

describe("proxy API security (L-17)", () => {
  const env = process.env as { NODE_ENV?: string; DISABLE_RATE_LIMIT?: string };
  let prevNodeEnv: string | undefined;
  let prevDisable: string | undefined;

  beforeEach(() => {
    prevNodeEnv = env.NODE_ENV;
    prevDisable = env.DISABLE_RATE_LIMIT;
    env.NODE_ENV = "production";
    delete env.DISABLE_RATE_LIMIT;
    vi.mocked(edgeCheckRateLimit).mockReset();
    vi.mocked(edgeCheckRateLimit).mockResolvedValue({
      allowed: true,
      remaining: 9,
      resetAt: Date.now() + 60_000,
    });
  });

  afterEach(() => {
    env.NODE_ENV = prevNodeEnv;
    if (prevDisable !== undefined) env.DISABLE_RATE_LIMIT = prevDisable;
    else delete env.DISABLE_RATE_LIMIT;
  });

  it("returns 429 when rate limit exceeded", async () => {
    vi.mocked(edgeCheckRateLimit).mockResolvedValue({
      allowed: false,
      remaining: 0,
      resetAt: Date.now() + 30_000,
    });
    const res = await proxy(apiRequest("/api/search?q=guitar"));
    expect(res?.status).toBe(429);
    const body = (await res?.json()) as { error?: string };
    expect(body.error).toMatch(/too many requests/i);
    expect(res?.headers.get("x-ratelimit-remaining")).toBe("0");
  });

  it("blocks cross-origin POST mutations with 403 (CSRF)", async () => {
    const res = await proxy(
      apiRequest("/api/payment/create-order", {
        method: "POST",
        headers: { origin: "https://evil.example.com" },
      }),
    );
    expect(res?.status).toBe(403);
    const body = (await res?.json()) as { error?: string };
    expect(body.error).toMatch(/invalid request origin/i);
  });

  it("allows webhook POST without origin check", async () => {
    const res = await proxy(
      apiRequest("/api/payment/webhook/razorpay", {
        method: "POST",
        headers: {},
      }),
    );
    expect(res?.status).not.toBe(403);
    expect(res?.headers.get("x-ratelimit-remaining")).toBeTruthy();
    expect(res?.headers.get("x-content-type-options")).toBe("nosniff");
  });

  it("uses auth bucket for /api/auth routes", async () => {
    await proxy(
      apiRequest("/api/auth/register", {
        method: "POST",
        headers: { origin: "https://vibemusic.in" },
      }),
    );
    expect(edgeCheckRateLimit).toHaveBeenCalledWith(
      expect.stringMatching(/^auth-api:/),
      expect.objectContaining({ limit: 20 }),
    );
  });

  it("uses checkout bucket for payment routes", async () => {
    await proxy(
      apiRequest("/api/payment/create-order", {
        method: "POST",
        headers: { origin: "https://vibemusic.in" },
      }),
    );
    expect(edgeCheckRateLimit).toHaveBeenCalledWith(
      expect.stringMatching(/^checkout-api:/),
      expect.objectContaining({ limit: 10 }),
    );
  });
});
