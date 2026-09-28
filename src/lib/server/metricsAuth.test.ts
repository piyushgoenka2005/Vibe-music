import { afterEach, describe, expect, it, vi } from "vitest";
import { isMetricsScrapeAuthorized } from "@/lib/server/metricsAuth";

function authRequest(token?: string): Request {
  return new Request("https://vibemusic.in/api/metrics", {
    headers: token ? { authorization: `Bearer ${token}` } : undefined,
  });
}

describe("isMetricsScrapeAuthorized", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("allows open access in non-production when token unset", () => {
    vi.stubEnv("NODE_ENV", "development");
    delete process.env.METRICS_SCRAPE_TOKEN;
    expect(isMetricsScrapeAuthorized(authRequest())).toBe(true);
  });

  it("requires bearer token in production", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("METRICS_SCRAPE_TOKEN", "secret-metrics-token");
    expect(isMetricsScrapeAuthorized(authRequest())).toBe(false);
    expect(isMetricsScrapeAuthorized(authRequest("secret-metrics-token"))).toBe(true);
    expect(isMetricsScrapeAuthorized(authRequest("wrong"))).toBe(false);
  });
});
