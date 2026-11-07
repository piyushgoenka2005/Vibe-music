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
    navigationMenu: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
    },
  },
}));

import { GET, PUT } from "./route";

describe("Footer API /api/admin/footer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("GET returns default footer configuration with sections and business identity", async () => {
    const req = new Request("http://localhost:3000/api/admin/footer");
    const res = await GET(req);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.config).toBeDefined();
    expect(Array.isArray(body.config.sections)).toBe(true);
    expect(body.config.sections.length).toBeGreaterThanOrEqual(3);
    expect(body.config.businessIdentity.legalName).toBeDefined();
  });

  it("PUT updates and saves footer sections and links", async () => {
    const payload = {
      followSectionEnabled: true,
      sections: [
        {
          id: "programs",
          label: "01 / Programs",
          sortOrder: 0,
          links: [
            { id: "p1", label: "All programs", url: "/programs", isActive: true, sortOrder: 0 },
          ],
        },
      ],
    };

    const req = new Request("http://localhost:3000/api/admin/footer", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const res = await PUT(req);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.config.sections[0].links[0].label).toBe("All programs");
  });
});
