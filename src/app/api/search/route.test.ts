import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/server/productRepository", () => ({
  searchProducts: vi.fn(),
}));

vi.mock("@/lib/server/searchResultsService", () => ({
  buildBrandFacets: vi.fn().mockReturnValue([]),
  buildCategoryFacets: vi.fn().mockReturnValue([]),
  SEARCH_MIN_QUERY_LENGTH: 2,
}));

vi.mock("@/lib/api/route-utils", async (importOriginal) => {
  const orig = await importOriginal<typeof import("@/lib/api/route-utils")>();
  return {
    ...orig,
    enforceRateLimit: vi.fn().mockResolvedValue(null),
  };
});

import { GET } from "./route";
import { searchProducts } from "@/lib/server/productRepository";
import { enforceRateLimit } from "@/lib/api/route-utils";

function makeRequest(url: string): Request {
  return new Request(url, { method: "GET" });
}

describe("GET /api/search", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(enforceRateLimit).mockResolvedValue(null);
    (searchProducts as ReturnType<typeof vi.fn>).mockResolvedValue([]);
  });

  it("returns search results for a query", async () => {
    const mockProducts = [{ id: "1", name: "Fender Stratocaster", slug: "fender-strat" }];
    (searchProducts as ReturnType<typeof vi.fn>).mockResolvedValue(mockProducts);

    const res = await GET(makeRequest("http://localhost/api/search?q=fender"));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.products).toHaveLength(1);
    expect(body.total).toBe(1);
  });

  it("returns empty results for short query", async () => {
    const res = await GET(makeRequest("http://localhost/api/search?q=a"));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.products).toEqual([]);
    expect(body.total).toBe(0);
  });

  it("returns 429 when rate limited", async () => {
    (enforceRateLimit as ReturnType<typeof vi.fn>).mockResolvedValue(
      new Response(JSON.stringify({ error: "Too many requests" }), { status: 429 })
    );

    const res = await GET(makeRequest("http://localhost/api/search?q=guitar"));
    expect(res.status).toBe(429);
  });

  it("handles errors gracefully", async () => {
    (searchProducts as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error("Search index unavailable")
    );

    const res = await GET(makeRequest("http://localhost/api/search?q=guitar"));
    expect(res.status).toBe(500);
  });

  it("sets Cache-Control headers", async () => {
    const res = await GET(makeRequest("http://localhost/api/search?q=guitar"));
    expect(res.headers.get("Cache-Control")).toContain("s-maxage");
  });
});
