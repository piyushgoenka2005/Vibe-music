import { NextResponse } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/server/tracing", () => ({
  traceSpan: vi.fn(async (_name, fn) => fn({ setAttribute: vi.fn() })),
}));

vi.mock("@/lib/api/route-observation", () => ({
  finalizeRouteObservation: vi.fn(),
}));

import { finalizeRouteObservation } from "@/lib/api/route-observation";
import { traceSpan } from "@/lib/server/tracing";
import { traceRouteHandler } from "@/lib/api/traceRoute";

describe("traceRouteHandler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("wraps handler with trace span and observation", async () => {
    const handler = vi.fn(async () => NextResponse.json({ ok: true }, { status: 200 }));
    const wrapped = traceRouteHandler("GET /api/test", handler);
    const request = new Request("http://localhost/api/test", {
      method: "GET",
      headers: { "x-request-start": String(Date.now() - 5) },
    });

    const response = await wrapped(request);

    expect(response.status).toBe(200);
    expect(traceSpan).toHaveBeenCalled();
    expect(handler).toHaveBeenCalledWith(request);
    expect(finalizeRouteObservation).toHaveBeenCalled();
  });
});
