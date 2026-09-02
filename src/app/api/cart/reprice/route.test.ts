import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/server/cartPricingService", () => ({
  repriceCartLines: vi.fn(),
}));

vi.mock("@/lib/api/route-utils", async (importOriginal) => {
  const orig = await importOriginal<typeof import("@/lib/api/route-utils")>();
  return {
    ...orig,
    enforceRateLimit: vi.fn().mockResolvedValue(null),
  };
});

import { POST } from "./route";
import { repriceCartLines } from "@/lib/server/cartPricingService";
import { enforceRateLimit } from "@/lib/api/route-utils";

function makePostRequest(body: Record<string, unknown>): Request {
  return new Request("http://localhost/api/cart/reprice", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/cart/reprice", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(enforceRateLimit).mockResolvedValue(null);
    (repriceCartLines as ReturnType<typeof vi.fn>).mockResolvedValue([
      { id: "1", price: 5000, quantity: 1 },
    ]);
  });

  it("reprices cart successfully", async () => {
    const mockResult = [
      { id: "1", price: 5000, quantity: 1 },
    ];
    (repriceCartLines as ReturnType<typeof vi.fn>).mockResolvedValue(mockResult);

    const res = await POST(
      makePostRequest({ items: [{ productId: "1", quantity: 1 }] })
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.items).toHaveLength(1);
    expect(body.subtotal).toBe(5000);
  });

  it("returns 429 when rate limited", async () => {
    (enforceRateLimit as ReturnType<typeof vi.fn>).mockResolvedValue(
      new Response(JSON.stringify({ error: "Too many requests" }), { status: 429 })
    );

    const res = await POST(makePostRequest({ items: [{ productId: "1", quantity: 1 }] }));
    expect(res.status).toBe(429);
  });

  it("returns 400 for invalid body (missing items)", async () => {
    const res = await POST(
      new Request("http://localhost/api/cart/reprice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      })
    );
    expect(res.status).toBe(400);
  });

  it("returns 400 for invalid JSON", async () => {
    const res = await POST(
      new Request("http://localhost/api/cart/reprice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "not json",
      })
    );
    expect(res.status).toBe(400);
  });

  it("handles service errors gracefully", async () => {
    (repriceCartLines as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error("Product not found")
    );

    const res = await POST(
      makePostRequest({ items: [{ productId: "invalid", quantity: 1 }] })
    );
    // publicApiError returns 400 for safe domain error messages
    expect(res.status).toBe(400);
  });
});
