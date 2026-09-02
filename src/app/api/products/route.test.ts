import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock dependencies before imports
vi.mock("@/lib/server/productRepository", () => ({
  getTrendingProducts: vi.fn(),
  searchProducts: vi.fn(),
}));

vi.mock("@/lib/server/redisCache", () => ({
  getCached: vi.fn((_key: string, fetcher: () => Promise<unknown>) => fetcher()),
}));

vi.mock("@/lib/api/route-utils", async (importOriginal) => {
  const orig = await importOriginal<typeof import("@/lib/api/route-utils")>();
  return {
    ...orig,
    enforceRateLimit: vi.fn().mockResolvedValue(null),
  };
});

import { GET } from "./route";
import { getTrendingProducts, searchProducts } from "@/lib/server/productRepository";
import { enforceRateLimit } from "@/lib/api/route-utils";

function makeRequest(url: string): Request {
  return new Request(url, { method: "GET" });
}

describe("GET /api/products", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(enforceRateLimit).mockResolvedValue(null);
    (searchProducts as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    (getTrendingProducts as ReturnType<typeof vi.fn>).mockResolvedValue([]);
  });

  it("returns trending products when trending=true", async () => {
    const mockProducts = [
      { id: "1", name: "Guitar", price: 5000 },
      { id: "2", name: "Bass", price: 8000 },
    ];
    (getTrendingProducts as ReturnType<typeof vi.fn>).mockResolvedValue(mockProducts);

    const res = await GET(makeRequest("http://localhost/api/products?trending=true"));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.products).toHaveLength(2);
    expect(body.products[0].name).toBe("Guitar");
  });

  it("limits trending products when limit param is set", async () => {
    const mockProducts = [
      { id: "1", name: "Guitar" },
      { id: "2", name: "Bass" },
      { id: "3", name: "Drums" },
    ];
    (getTrendingProducts as ReturnType<typeof vi.fn>).mockResolvedValue(mockProducts);

    const res = await GET(makeRequest("http://localhost/api/products?trending=true&limit=2"));
    const body = await res.json();

    expect(body.products).toHaveLength(2);
  });

  it("searches products with query", async () => {
    (searchProducts as ReturnType<typeof vi.fn>).mockResolvedValue([
      { id: "1", name: "Fender Stratocaster" },
    ]);

    const res = await GET(makeRequest("http://localhost/api/products?q=fender"));
    const _body = await res.json();

    expect(res.status).toBe(200);
    expect(searchProducts).toHaveBeenCalledWith(
      expect.objectContaining({ query: "fender" })
    );
  });

  it("filters by category", async () => {
    await GET(makeRequest("http://localhost/api/products?category=guitars"));

    expect(searchProducts).toHaveBeenCalledWith(
      expect.objectContaining({ category: "guitars" })
    );
  });

  it("filters by brand", async () => {
    await GET(makeRequest("http://localhost/api/products?brand=fender"));

    expect(searchProducts).toHaveBeenCalledWith(
      expect.objectContaining({ brand: "fender" })
    );
  });

  it("returns 429 when rate limited", async () => {
    (enforceRateLimit as ReturnType<typeof vi.fn>).mockResolvedValue(
      new Response(JSON.stringify({ error: "Too many requests" }), { status: 429 })
    );

    const res = await GET(makeRequest("http://localhost/api/products"));
    expect(res.status).toBe(429);
  });

  it("sets Cache-Control headers", async () => {
    const res = await GET(makeRequest("http://localhost/api/products"));
    expect(res.headers.get("Cache-Control")).toContain("s-maxage");
  });

  it("handles errors gracefully", async () => {
    (searchProducts as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error("DB connection failed")
    );

    const res = await GET(makeRequest("http://localhost/api/products"));
    expect(res.status).toBe(500);
  });
});
