import { afterEach, describe, expect, it, vi } from "vitest";
import { GET } from "@/app/api/metrics/route";

vi.mock("@/lib/server/postgresHealth", () => ({
  verifyPostgresConnection: vi.fn().mockResolvedValue({ ok: true }),
}));

vi.mock("@/lib/db/prisma", () => ({
  getRawPrisma: vi.fn().mockReturnValue({
    product: { count: vi.fn().mockResolvedValue(10) },
    order: { count: vi.fn().mockResolvedValue(5) },
  }),
}));

describe("GET /api/metrics", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns 401 without bearer token in production", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("METRICS_SCRAPE_TOKEN", "metrics-secret");
    const response = await GET(new Request("https://vibemusic.in/api/metrics"));
    expect(response.status).toBe(401);
  });

  it("returns Prometheus text with valid bearer token", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("METRICS_SCRAPE_TOKEN", "metrics-secret");
    const response = await GET(
      new Request("https://vibemusic.in/api/metrics", {
        headers: { authorization: "Bearer metrics-secret" },
      }),
    );
    expect(response.status).toBe(200);
    const body = await response.text();
    expect(body).toContain("vibe_http_requests_total");
  });
});
