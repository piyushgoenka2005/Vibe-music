import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/services/catalogService", () => ({
  getCategories: vi.fn(),
}));

vi.mock("@/lib/api/route-utils", async (importOriginal) => {
  const orig = await importOriginal<typeof import("@/lib/api/route-utils")>();
  return {
    ...orig,
    enforceRateLimit: vi.fn().mockResolvedValue(null),
  };
});

import { GET } from "./route";
import { getCategories } from "@/services/catalogService";
import { enforceRateLimit } from "@/lib/api/route-utils";

function makeRequest(url: string): Request {
  return new Request(url, { method: "GET" });
}

describe("GET /api/catalog/categories", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(enforceRateLimit).mockResolvedValue(null);
    (getCategories as ReturnType<typeof vi.fn>).mockResolvedValue([
      { id: "1", name: "Guitars", slug: "guitars", productCount: 50 },
      { id: "2", name: "Drums", slug: "drums", productCount: 30 },
    ]);
  });

  it("returns category catalog", async () => {
    const res = await GET(makeRequest("http://localhost/api/catalog/categories"));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.categories).toHaveLength(2);
    expect(body.categories[0].name).toBe("Guitars");
  });

  it("returns 429 when rate limited", async () => {
    (enforceRateLimit as ReturnType<typeof vi.fn>).mockResolvedValue(
      new Response(JSON.stringify({ error: "Too many requests" }), { status: 429 })
    );

    const res = await GET(makeRequest("http://localhost/api/catalog/categories"));
    expect(res.status).toBe(429);
  });

  it("handles errors gracefully", async () => {
    (getCategories as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error("Catalog unavailable")
    );

    const res = await GET(makeRequest("http://localhost/api/catalog/categories"));
    expect(res.status).toBe(500);
  });

  it("sets Cache-Control headers", async () => {
    const res = await GET(makeRequest("http://localhost/api/catalog/categories"));
    expect(res.headers.get("Cache-Control")).toContain("s-maxage");
  });
});
