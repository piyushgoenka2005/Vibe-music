import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/auth/require-admin", () => ({
  requireAdmin: vi.fn(),
  adminErrorResponse: vi.fn((error: unknown) => {
    throw error;
  }),
}));

vi.mock("@/services/catalogService", () => ({
  getProductBySlug: vi.fn(),
}));

import { POST } from "@/app/api/admin/coupons/resolve-products/route";
import { requireAdmin } from "@/lib/auth/require-admin";
import { getProductBySlug } from "@/services/catalogService";

describe("POST /api/admin/coupons/resolve-products", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireAdmin).mockResolvedValue({ uid: "admin-1" } as never);
  });

  it("resolves product URLs into catalog ids", async () => {
    vi.mocked(getProductBySlug).mockImplementation(async (slug: string) => {
      if (slug === "yamaha-p125") {
        return { id: "prod-1", slug, name: "Yamaha P-125" } as never;
      }
      return undefined;
    });

    const request = new Request("http://localhost/api/admin/coupons/resolve-products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        urls: ["https://vibemusic.in/product/yamaha-p125", "/product/missing"],
      }),
    });

    const response = await POST(request);
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.products).toEqual([{ slug: "yamaha-p125", id: "prod-1", name: "Yamaha P-125" }]);
    expect(payload.productIds).toEqual(["prod-1"]);
    expect(payload.notFound).toEqual(["missing"]);
  });

  it("reports invalid URL paste entries", async () => {
    const request = new Request("http://localhost/api/admin/coupons/resolve-products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ urls: ["not a valid product url !!!"] }),
    });

    const response = await POST(request);
    const payload = await response.json();

    expect(payload.invalid).toHaveLength(1);
    expect(payload.products).toHaveLength(0);
  });
});
