import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/server/giveawayRepository", () => ({
  listPublicGiveawayCampaigns: vi.fn(),
}));

vi.mock("@/lib/api/route-utils", async (importOriginal) => {
  const orig = await importOriginal<typeof import("@/lib/api/route-utils")>();
  return {
    ...orig,
    enforceRateLimit: vi.fn().mockResolvedValue(null),
  };
});

import { GET } from "./route";
import { listPublicGiveawayCampaigns } from "@/lib/server/giveawayRepository";
import { enforceRateLimit } from "@/lib/api/route-utils";

function makeRequest(url: string): Request {
  return new Request(url, { method: "GET" });
}

describe("GET /api/giveaway/campaigns", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(enforceRateLimit).mockResolvedValue(null);
    (listPublicGiveawayCampaigns as ReturnType<typeof vi.fn>).mockResolvedValue([]);
  });

  it("returns active giveaway campaigns", async () => {
    const mockCampaigns = [
      { id: "1", title: "Win a Guitar", slug: "win-guitar" },
    ];
    (listPublicGiveawayCampaigns as ReturnType<typeof vi.fn>).mockResolvedValue(mockCampaigns);

    const res = await GET(makeRequest("http://localhost/api/giveaway/campaigns"));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.campaigns).toHaveLength(1);
    expect(body.campaigns[0].title).toBe("Win a Guitar");
  });

  it("returns 429 when rate limited", async () => {
    (enforceRateLimit as ReturnType<typeof vi.fn>).mockResolvedValue(
      new Response(JSON.stringify({ error: "Too many requests" }), { status: 429 })
    );

    const res = await GET(makeRequest("http://localhost/api/giveaway/campaigns"));
    expect(res.status).toBe(429);
  });

  it("handles errors gracefully", async () => {
    (listPublicGiveawayCampaigns as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error("DB error")
    );

    const res = await GET(makeRequest("http://localhost/api/giveaway/campaigns"));
    // publicApiError returns 400 for safe domain error messages
    expect(res.status).toBe(400);
  });

  it("returns empty array when no campaigns exist", async () => {
    (listPublicGiveawayCampaigns as ReturnType<typeof vi.fn>).mockResolvedValue([]);

    const res = await GET(makeRequest("http://localhost/api/giveaway/campaigns"));
    const body = await res.json();

    expect(body.campaigns).toEqual([]);
  });
});
