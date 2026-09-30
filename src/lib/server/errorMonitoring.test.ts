import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  isErrorMonitoringConfigured,
  reportServerError,
  resetErrorMonitoringForTests,
} from "@/lib/server/errorMonitoring";

const sentryCaptureException = vi.fn();

vi.mock("@sentry/node", () => ({
  init: vi.fn(),
  withScope: (callback: (scope: { setTag: typeof vi.fn; setContext: typeof vi.fn }) => void) => {
    callback({
      setTag: vi.fn(),
      setContext: vi.fn(),
    });
  },
  captureException: (...args: unknown[]) => sentryCaptureException(...args),
}));

describe("errorMonitoring", () => {
  const fetchMock = vi.fn().mockResolvedValue({ ok: true });

  beforeEach(() => {
    resetErrorMonitoringForTests();
    vi.stubGlobal("fetch", fetchMock);
    fetchMock.mockClear();
    sentryCaptureException.mockClear();
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

  it("reports configured when Sentry DSN is set", () => {
    process.env.SENTRY_DSN = "https://examplePublicKey@o0.ingest.sentry.io/0";
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

  it("captures exceptions in Sentry when DSN is configured", async () => {
    process.env.SENTRY_DSN = "https://examplePublicKey@o0.ingest.sentry.io/0";
    reportServerError(new Error("sentry test"), {
      source: "api/test",
      routePath: "/api/test",
    });

    await vi.waitFor(() => {
      expect(sentryCaptureException).toHaveBeenCalledTimes(1);
    });
  });
});
