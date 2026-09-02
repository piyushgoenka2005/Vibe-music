import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/server/shippingQuoteService", () => ({
  getShippingQuotes: vi.fn(),
}));

vi.mock("@/lib/api/route-utils", async (importOriginal) => {
  const orig = await importOriginal<typeof import("@/lib/api/route-utils")>();
  return {
    ...orig,
    enforceRateLimit: vi.fn().mockResolvedValue(null),
  };
});

import { POST } from "./route";
import { getShippingQuotes } from "@/lib/server/shippingQuoteService";
import { enforceRateLimit } from "@/lib/api/route-utils";

function makePostRequest(body: Record<string, unknown>): Request {
  return new Request("http://localhost/api/shipping/quote", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/shipping/quote", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(enforceRateLimit).mockResolvedValue(null);
    (getShippingQuotes as ReturnType<typeof vi.fn>).mockResolvedValue([
      { method: "standard", name: "Standard Shipping", price: 100, days: "5-7" },
    ]);
  });

  it("returns shipping quote for valid request", async () => {
    const mockQuote = [
      { method: "standard", name: "Standard Shipping", price: 100, days: "5-7" },
    ];
    (getShippingQuotes as ReturnType<typeof vi.fn>).mockResolvedValue(mockQuote);

    const res = await POST(
      makePostRequest({ subtotal: 5000, postalCode: "110001" })
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(Array.isArray(body)).toBe(true);
    expect(body[0].method).toBe("standard");
  });

  it("returns 429 when rate limited", async () => {
    (enforceRateLimit as ReturnType<typeof vi.fn>).mockResolvedValue(
      new Response(JSON.stringify({ error: "Too many requests" }), { status: 429 })
    );

    const res = await POST(makePostRequest({ subtotal: 5000 }));
    expect(res.status).toBe(429);
  });

  it("returns 400 for invalid body", async () => {
    const res = await POST(
      new Request("http://localhost/api/shipping/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      })
    );
    expect(res.status).toBe(400);
  });

  it("returns 400 for invalid JSON", async () => {
    const res = await POST(
      new Request("http://localhost/api/shipping/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "invalid json",
      })
    );
    expect(res.status).toBe(400);
  });

  it("handles service errors gracefully", async () => {
    (getShippingQuotes as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error("Pincode not serviceable")
    );

    const res = await POST(
      makePostRequest({ subtotal: 5000, postalCode: "999999" })
    );
    // publicApiError returns 400 for safe domain error messages
    expect(res.status).toBe(400);
  });
});
