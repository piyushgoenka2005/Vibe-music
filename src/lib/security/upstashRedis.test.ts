import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  getUpstashConfig,
  markUpstashAuthFailed,
  resetUpstashAuthState,
  isUpstashAuthFailed,
  upstashPipeline,
} from "./upstashRedis";

describe("upstashRedis — Auth failure resilience", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    resetUpstashAuthState();
    process.env.UPSTASH_REDIS_REST_URL = "https://example-redis.upstash.io";
    process.env.UPSTASH_REDIS_REST_TOKEN = "valid_token";
  });

  afterEach(() => {
    global.fetch = originalFetch;
    resetUpstashAuthState();
  });

  it("returns config when env vars are present and auth has not failed", () => {
    const config = getUpstashConfig();
    expect(config).toEqual({
      url: "https://example-redis.upstash.io",
      token: "valid_token",
    });
    expect(isUpstashAuthFailed()).toBe(false);
  });

  it("returns null when env vars are missing", () => {
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
    expect(getUpstashConfig()).toBeNull();
  });

  it("marks auth failed and returns null after receiving 401 Unauthorized", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      text: async () => JSON.stringify({ error: "WRONGPASS invalid or missing auth token" }),
    });

    await expect(upstashPipeline([["PING"]])).rejects.toThrow("Upstash request failed: 401");

    expect(isUpstashAuthFailed()).toBe(true);

    // Subsequent calls to getUpstashConfig must return null to seamlessly trigger in-memory fallbacks
    expect(getUpstashConfig()).toBeNull();
  });

  it("marks auth failed and returns null after receiving 403 Forbidden", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 403,
      text: async () => JSON.stringify({ error: "Forbidden" }),
    });

    await expect(upstashPipeline([["PING"]])).rejects.toThrow("Upstash request failed: 403");

    expect(isUpstashAuthFailed()).toBe(true);
    expect(getUpstashConfig()).toBeNull();
  });

  it("does not mark auth failed on transient 500 errors", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      text: async () => JSON.stringify({ error: "Internal Server Error" }),
    });

    await expect(upstashPipeline([["PING"]])).rejects.toThrow("Upstash request failed: 500");

    expect(isUpstashAuthFailed()).toBe(false);
    expect(getUpstashConfig()).not.toBeNull();
  });

  it("allows marking auth failed directly via markUpstashAuthFailed", () => {
    expect(isUpstashAuthFailed()).toBe(false);
    markUpstashAuthFailed();
    expect(isUpstashAuthFailed()).toBe(true);
    expect(getUpstashConfig()).toBeNull();
  });
});
