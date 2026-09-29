import { describe, expect, it } from "vitest";
import {
  buildRateLimits,
  DEFAULT_RATE_LIMITS,
  describeRateLimitConfig,
} from "@/lib/security/rate-limit-config";

describe("rate-limit-config", () => {
  it("uses increased admin defaults for catalog work", () => {
    const limits = buildRateLimits({});
    expect(limits.admin.limit).toBeGreaterThanOrEqual(600);
    expect(limits.adminUpload.limit).toBeGreaterThanOrEqual(240);
    expect(limits.adminBulkImport.windowMs).toBe(300_000);
  });

  it("applies per-scope env overrides", () => {
    const limits = buildRateLimits({
      RATE_LIMIT_ADMIN_LIMIT: "900",
      RATE_LIMIT_ADMIN_WINDOW_MS: "120000",
    });
    expect(limits.admin).toEqual({ limit: 900, windowMs: 120_000 });
  });

  it("applies a global multiplier without changing window size", () => {
    const limits = buildRateLimits({
      RATE_LIMIT_MULTIPLIER: "2",
    });
    expect(limits.auth.limit).toBe(DEFAULT_RATE_LIMITS.auth.limit * 2);
    expect(limits.auth.windowMs).toBe(DEFAULT_RATE_LIMITS.auth.windowMs);
  });

  it("describes the active config for observability", () => {
    const rows = describeRateLimitConfig(buildRateLimits({}));
    expect(rows.some((row) => row.scope === "adminBulkImport")).toBe(true);
    expect(rows.every((row) => row.windowSec > 0)).toBe(true);
  });
});
