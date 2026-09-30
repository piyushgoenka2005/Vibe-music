import { beforeEach, describe, expect, it, vi } from "vitest";

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

vi.mock("@/lib/admin/bulkImportZipImages", () => ({
  createEmptyBulkImportZipImageIndex: vi.fn(() => ({
    byBasename: new Map(),
    byRelativePath: new Map(),
    entries: [],
  })),
  readBulkImportZipImageIndex: vi.fn(() => ({
    byBasename: new Map(),
    byRelativePath: new Map(),
    entries: [],
  })),
  readBulkImportZipImageMap: vi.fn(() => new Map()),
}));

vi.mock("@/lib/server/bulkImportImageResolver", () => ({
  resolveBulkImportImages: vi.fn(async (rows: unknown[]) => rows),
}));

vi.mock("@/services/catalogService", () => ({
  enrichBulkImportRowSlugs: vi.fn(async (rows: unknown[]) => rows),
  enrichBulkImportRowSkus: vi.fn(async (rows: unknown[]) => rows),
  previewBulkImport: vi.fn(async () => [{ valid: true, sku: "TEST-SKU", name: "Test Product" }]),
  buildBulkImportPreviewSummary: vi.fn(() => ({
    validRows: 1,
    invalidRows: 0,
    createCount: 1,
    updateCount: 0,
  })),
  bulkImportProducts: vi.fn(async () => ({
    imported: 1,
    updated: 0,
    skipped: 0,
    errors: [],
    failedRows: [],
  })),
}));

vi.mock("@/lib/amazonListingImport", async (importOriginal) => {
  const orig = await importOriginal<typeof import("@/lib/amazonListingImport")>();
  return {
    ...orig,
    isSpreadsheetUpload: vi.fn(() => true),
    parseProductImportBuffer: vi.fn(() => ({
      format: "vibemusic-bulk",
      headers: orig.VIBEMUSIC_BULK_HEADERS,
      rows: [{ name: "Test", sku: "TEST-SKU", brand: "Brand", category: "Guitars", price: 1000 }],
      emptyRowsSkipped: 0,
    })),
    validateVibemusicBulkHeaders: vi.fn(() => null),
  };
});

import { POST } from "./route";
import { requireAdmin, AdminAuthError } from "@/lib/auth/require-admin";
import { bulkImportProducts, previewBulkImport } from "@/services/catalogService";
import { buildVibemusicBulkTemplateCsv } from "@/lib/admin/bulkImportTemplate";

const adminUser = {
  uid: "admin-1",
  email: "admin@test.com",
  displayName: "Admin",
  role: "super_admin" as const,
  permissions: ["products:write"],
};

function makeMultipartRequest(options: { confirm?: boolean } = {}): Request {
  const csv = buildVibemusicBulkTemplateCsv();
  const form = new FormData();
  form.set("file", new File([csv], "vibemusic-bulk.csv", { type: "text/csv" }));
  form.set("confirm", options.confirm ? "true" : "false");
  form.set("options", JSON.stringify({ mode: "create" }));

  return new Request("http://localhost/api/admin/products/import", {
    method: "POST",
    body: form,
  });
}

describe("POST /api/admin/products/import", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireAdmin).mockResolvedValue(adminUser);
  });

  it("requires admin authentication", async () => {
    vi.mocked(requireAdmin).mockRejectedValue(new AdminAuthError("Authentication required", 401));

    const res = await POST(makeMultipartRequest());
    expect(res.status).toBe(401);
  });

  it("rejects non-multipart requests", async () => {
    const res = await POST(
      new Request("http://localhost/api/admin/products/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirm: false }),
      }),
    );
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error?: string };
    expect(body.error).toMatch(/multipart/i);
  });

  it("returns preview when confirm=false", async () => {
    const res = await POST(makeMultipartRequest({ confirm: false }));
    expect(res.status).toBe(200);
    expect(previewBulkImport).toHaveBeenCalled();
    expect(bulkImportProducts).not.toHaveBeenCalled();
    const body = (await res.json()) as { preview?: unknown[]; summary?: { validRows?: number } };
    expect(body.preview).toHaveLength(1);
    expect(body.summary?.validRows).toBe(1);
  });

  it("imports products when confirm=true", async () => {
    const res = await POST(makeMultipartRequest({ confirm: true }));
    expect(res.status).toBe(200);
    expect(bulkImportProducts).toHaveBeenCalledWith(
      expect.any(Array),
      expect.objectContaining({ adminId: adminUser.uid }),
    );
    expect(previewBulkImport).not.toHaveBeenCalled();
    const body = (await res.json()) as { result?: { imported?: number } };
    expect(body.result?.imported).toBe(1);
  });
});
