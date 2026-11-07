import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth/require-admin", () => ({
  requireAdmin: vi.fn(),
}));

vi.mock("@/lib/db/prisma", () => ({
  isPostgresConfigured: () => false,
  prisma: {
    taxCategory: {
      count: vi.fn().mockResolvedValue(6),
      findMany: vi.fn().mockResolvedValue([]),
      create: vi.fn(),
      upsert: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

import { GET, POST, PUT, DELETE } from "./route";
import { NextRequest } from "next/server";

describe("Tax API /api/admin/tax", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("GET returns taxCategories list and Indian GST stats", async () => {
    const req = new NextRequest("http://localhost:3000/api/admin/tax");
    const res = await GET(req);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(Array.isArray(body.taxCategories)).toBe(true);
    expect(body.taxCategories.length).toBeGreaterThan(0);
    expect(body.stats.standardGstRate).toBe("18%");
  });

  it("POST creates a new HSN tax rate with calculated intra and inter state rates", async () => {
    const req = new NextRequest("http://localhost:3000/api/admin/tax", {
      method: "POST",
      body: JSON.stringify({
        hsnCode: "9201",
        name: "Pianos & Harpsichords",
        description: "Acoustic grand and upright pianos",
        gstRate: 18,
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(201);

    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.category.hsnCode).toBe("9201");
    expect(body.category.gstRate).toBe(18);
    expect(body.category.cgstRate).toBe(9);
    expect(body.category.sgstRate).toBe(9);
    expect(body.category.igstRate).toBe(18);
  });

  it("PUT updates an existing HSN tax rate", async () => {
    const req = new NextRequest("http://localhost:3000/api/admin/tax", {
      method: "PUT",
      body: JSON.stringify({
        hsnCode: "9201",
        name: "Updated Pianos & Keyboards",
        gstRate: 12,
      }),
    });

    const res = await PUT(req);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.category.name).toBe("Updated Pianos & Keyboards");
    expect(body.category.gstRate).toBe(12);
    expect(body.category.cgstRate).toBe(6);
    expect(body.category.sgstRate).toBe(6);
  });

  it("DELETE removes an HSN tax rate", async () => {
    const req = new NextRequest("http://localhost:3000/api/admin/tax?hsnCode=9201", {
      method: "DELETE",
    });

    const res = await DELETE(req);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.success).toBe(true);
  });
});
