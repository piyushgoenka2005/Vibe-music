import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth/require-admin", () => ({
  requireAdmin: vi.fn(),
  adminErrorResponse: (error: unknown) => {
    const message = error instanceof Error ? error.message : "Error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  },
}));

vi.mock("@/lib/db/prisma", () => ({
  isPostgresConfigured: () => false,
  prisma: {
    localizationSetting: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
    },
  },
}));

import { GET, PUT } from "./route";

describe("SEO API /api/admin/seo", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("GET returns default SEO settings including title, description, and sitemap rules", async () => {
    const req = new Request("http://localhost:3000/api/admin/seo");
    const res = await GET(req);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.settings).toBeDefined();
    expect(body.settings.siteTitle).toContain("Vibe Music");
    expect(body.settings.sitemapFrequency).toBe("daily");
    expect(body.settings.robotsTxtDirectives).toContain("Sitemap:");
  });

  it("PUT updates and validates SEO configuration", async () => {
    const payload = {
      siteTitle: "Custom Vibe Music Title",
      metaDescription: "Custom meta description for testing the SEO admin configuration.",
      keywords: "guitar, bass, drums",
      canonicalBaseUrl: "https://vibemusic.in",
      ogImage: "/custom-og.jpg",
      twitterCard: "summary_large_image",
      twitterHandle: "@vibemusic",
      robotsTxtDirectives: "User-agent: *\nAllow: /",
      sitemapFrequency: "hourly",
      sitemapPriorityHome: 1.0,
      sitemapPriorityProducts: 0.9,
      sitemapPriorityCategories: 0.8,
      sitemapPriorityPages: 0.7,
      googleSiteVerification: "custom-token-123",
      bingSiteVerification: "bing-token-456",
      gaMeasurementId: "G-TESTING123",
    };

    const req = new Request("http://localhost:3000/api/admin/seo", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const res = await PUT(req);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.settings.siteTitle).toBe("Custom Vibe Music Title");
    expect(body.settings.gaMeasurementId).toBe("G-TESTING123");
  });
});
