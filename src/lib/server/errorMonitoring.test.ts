import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { isErrorMonitoringConfigured, reportServerError } from "@/lib/server/errorMonitoring";

describe("errorMonitoring", () => {
  const fetchMock = vi.fn().mockResolvedValue({ ok: true });

  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock);
    fetchMock.mockClear();
    delete process.env.ERROR_MONITORING_WEBHOOK_URL;
    delete process.env.SENTRY_DSN;
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("reports configured when webhook URL is set", () => {
    process.env.ERROR_MONITORING_WEBHOOK_URL = "https://hooks.example.com/errors";
    expect(isErrorMonitoringConfigured()).toBe(true);
  });

  it("dedupes identical errors", () => {
    process.env.ERROR_MONITORING_WEBHOOK_URL = "https://hooks.example.com/errors";
    const error = new Error("checkout exploded");

    reportServerError(error, { source: "api/checkout", routePath: "/api/checkout" });
    reportServerError(error, { source: "api/checkout", routePath: "/api/checkout" });

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("posts structured payload to webhook", async () => {
    process.env.ERROR_MONITORING_WEBHOOK_URL = "https://hooks.example.com/errors";
    reportServerError(new Error("payment failed"), {
      source: "api/payment",
      routePath: "/api/payment/verify-payment",
      requestId: "req-1",
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://hooks.example.com/errors");
    const body = JSON.parse(String(init.body));
    expect(body.service).toBe("vibe-music");
    expect(body.error.message).toBe("payment failed");
    expect(body.context.requestId).toBe("req-1");
  });
});
