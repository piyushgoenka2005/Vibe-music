import { describe, expect, it, vi } from "vitest";
import { NextResponse } from "next/server";
import {
  finalizeRouteObservation,
  observeRouteHandler,
  REQUEST_START_HEADER,
} from "@/lib/api/route-observation";
import { getRequestMetrics } from "@/lib/server/requestMetrics";

function requestWithStart(path = "/api/search"): Request {
  return new Request(`https://vibemusic.in${path}`, {
    headers: {
      [REQUEST_START_HEADER]: String(Date.now() - 25),
      "x-request-id": "test-request-id",
    },
  });
}

describe("route-observation", () => {
  it("records metrics when request start header is present", () => {
    const before = getRequestMetrics().requestCount;
    finalizeRouteObservation(requestWithStart(), new NextResponse(null, { status: 200 }));
    expect(getRequestMetrics().requestCount).toBe(before + 1);
  });

  it("skips when start header is missing", () => {
    const before = getRequestMetrics().requestCount;
    finalizeRouteObservation(
      new Request("https://vibemusic.in/api/search"),
      new NextResponse(null, { status: 200 }),
    );
    expect(getRequestMetrics().requestCount).toBe(before);
  });

  it("wraps handlers with observeRouteHandler", async () => {
    const handler = observeRouteHandler(async () => NextResponse.json({ ok: true }));
    const response = await handler(requestWithStart("/api/health"));
    expect(response.status).toBe(200);
  });

  it("records 500 when wrapped handler throws", async () => {
    const before = getRequestMetrics().requestCount;
    const handler = observeRouteHandler(async () => {
      throw new Error("boom");
    });
    await expect(handler(requestWithStart())).rejects.toThrow("boom");
    expect(getRequestMetrics().requestCount).toBe(before + 1);
  });
});
