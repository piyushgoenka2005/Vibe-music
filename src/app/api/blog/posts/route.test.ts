import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/server/blogService", () => ({
  listPublicBlogPostsPaginated: vi.fn(),
}));

vi.mock("@/lib/api/route-utils", async (importOriginal) => {
  const orig = await importOriginal<typeof import("@/lib/api/route-utils")>();
  return {
    ...orig,
    enforceRateLimit: vi.fn().mockResolvedValue(null),
  };
});

import { GET } from "./route";
import { listPublicBlogPostsPaginated } from "@/lib/server/blogService";
import { enforceRateLimit } from "@/lib/api/route-utils";

function makeRequest(url: string): Request {
  return new Request(url, { method: "GET" });
}

describe("GET /api/blog/posts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(enforceRateLimit).mockResolvedValue(null);
    (listPublicBlogPostsPaginated as ReturnType<typeof vi.fn>).mockResolvedValue({
      posts: [],
      total: 0,
      page: 1,
      limit: 9,
    });
  });

  it("returns paginated blog posts", async () => {
    const mockResult = {
      posts: [{ id: "1", title: "Test Post", slug: "test-post" }],
      total: 1,
      page: 1,
      limit: 9,
    };
    (listPublicBlogPostsPaginated as ReturnType<typeof vi.fn>).mockResolvedValue(mockResult);

    const res = await GET(makeRequest("http://localhost/api/blog/posts"));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.posts).toHaveLength(1);
    expect(body.total).toBe(1);
  });

  it("passes pagination params", async () => {
    await GET(makeRequest("http://localhost/api/blog/posts?page=2&limit=5"));

    expect(listPublicBlogPostsPaginated).toHaveBeenCalledWith(
      expect.objectContaining({ page: 2, limit: 5 })
    );
  });

  it("passes category filter", async () => {
    await GET(makeRequest("http://localhost/api/blog/posts?category=news"));

    expect(listPublicBlogPostsPaginated).toHaveBeenCalledWith(
      expect.objectContaining({ category: "news" })
    );
  });

  it("passes search query", async () => {
    await GET(makeRequest("http://localhost/api/blog/posts?q=guitar"));

    expect(listPublicBlogPostsPaginated).toHaveBeenCalledWith(
      expect.objectContaining({ q: "guitar" })
    );
  });

  it("passes featured filter", async () => {
    await GET(makeRequest("http://localhost/api/blog/posts?featured=true"));

    expect(listPublicBlogPostsPaginated).toHaveBeenCalledWith(
      expect.objectContaining({ featured: true })
    );
  });

  it("defaults page to 1 and limit to 9", async () => {
    await GET(makeRequest("http://localhost/api/blog/posts"));

    expect(listPublicBlogPostsPaginated).toHaveBeenCalledWith(
      expect.objectContaining({ page: 1, limit: 9 })
    );
  });

  it("handles invalid page/limit gracefully", async () => {
    await GET(makeRequest("http://localhost/api/blog/posts?page=abc&limit=xyz"));

    expect(listPublicBlogPostsPaginated).toHaveBeenCalledWith(
      expect.objectContaining({ page: 1, limit: 9 })
    );
  });

  it("returns 429 when rate limited", async () => {
    (enforceRateLimit as ReturnType<typeof vi.fn>).mockResolvedValue(
      new Response(JSON.stringify({ error: "Too many requests" }), { status: 429 })
    );

    const res = await GET(makeRequest("http://localhost/api/blog/posts"));
    expect(res.status).toBe(429);
  });

  it("handles errors gracefully", async () => {
    (listPublicBlogPostsPaginated as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error("DB error")
    );

    const res = await GET(makeRequest("http://localhost/api/blog/posts"));
    // publicApiError returns 400 for safe domain error messages
    expect(res.status).toBe(400);
  });
});
