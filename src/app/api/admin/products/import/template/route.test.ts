import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/auth/require-admin", () => {
  class MockAdminAuthError extends Error {
    status: 401 | 403;
    constructor(message: string, status: 401 | 403 = 403) {
      super(message);
      this.name = "AdminAuthError";
      this.status = status;
    }
  }

  return {
    AdminAuthError: MockAdminAuthError,
    requireAdmin: vi.fn(),
    adminErrorResponse: (error: unknown) => {
      const status =
        error instanceof MockAdminAuthError
          ? error.status
          : error &&
              typeof error === "object" &&
              "status" in error &&
              typeof (error as { status?: number }).status === "number"
            ? (error as { status: number }).status
            : 500;
      const message = error instanceof Error ? error.message : "Admin error";
      return new Response(JSON.stringify({ error: message }), {
        status,
        headers: { "Content-Type": "application/json" },
      });
    },
  };
});

import { GET } from "./route";
import { requireAdmin, AdminAuthError } from "@/lib/auth/require-admin";
import {
  VIBEMUSIC_BULK_HEADERS,
  VIBEMUSIC_BULK_TEMPLATE_CSV_FILE,
  VIBEMUSIC_BULK_TEMPLATE_XLSX_FILE,
} from "@/lib/admin/bulkImportTemplate";

function makeRequest(format?: string): Request {
  const url = format
    ? `http://localhost/api/admin/products/import/template?format=${format}`
    : "http://localhost/api/admin/products/import/template";
  return new Request(url, { method: "GET" });
}

describe("GET /api/admin/products/import/template", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireAdmin).mockResolvedValue({
      uid: "admin-1",
      email: "admin@test.com",
      displayName: "Admin",
      role: "super_admin",
      permissions: ["products:read"],
    });
  });

  it("requires admin authentication", async () => {
    vi.mocked(requireAdmin).mockRejectedValue(new AdminAuthError("Authentication required", 401));

    const res = await GET(makeRequest("csv"));
    expect(res.status).toBe(401);
  });

  it("returns CSV template with correct headers and filename", async () => {
    const res = await GET(makeRequest("csv"));
    const body = await res.text();

    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toContain("text/csv");
    expect(res.headers.get("Content-Disposition")).toContain(VIBEMUSIC_BULK_TEMPLATE_CSV_FILE);
    expect(body.trim()).toBe([...VIBEMUSIC_BULK_HEADERS].join(","));
  });

  it("returns XLSX template with spreadsheet content type", async () => {
    const res = await GET(makeRequest("xlsx"));
    const buffer = Buffer.from(await res.arrayBuffer());

    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toContain("spreadsheetml.sheet");
    expect(res.headers.get("Content-Disposition")).toContain(VIBEMUSIC_BULK_TEMPLATE_XLSX_FILE);
    expect(buffer.byteLength).toBeGreaterThan(100);
  });

  it("rejects missing or invalid format query", async () => {
    const missing = await GET(makeRequest());
    expect(missing.status).toBe(400);

    const invalid = await GET(makeRequest("pdf"));
    expect(invalid.status).toBe(400);
  });

  it("checks products:read permission", async () => {
    await GET(makeRequest("csv"));
    expect(requireAdmin).toHaveBeenCalledWith("products:read", expect.any(Request));
  });
});
