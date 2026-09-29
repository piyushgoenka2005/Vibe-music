import { describe, expect, it } from "vitest";
import { resolveRateLimitScope } from "@/lib/security/rate-limit-scopes";

describe("resolveRateLimitScope", () => {
  it("uses a dedicated bucket for bulk import", () => {
    const resolved = resolveRateLimitScope("/api/admin/products/import");
    expect(resolved.scope).toBe("admin-bulk-import");
    expect(resolved.bucket).toBe("adminBulkImport");
    expect(resolved.options.limit).toBeGreaterThanOrEqual(40);
  });

  it("uses a dedicated bucket for admin uploads", () => {
    const resolved = resolveRateLimitScope("/api/admin/upload/images");
    expect(resolved.scope).toBe("admin-upload");
    expect(resolved.bucket).toBe("adminUpload");
    expect(resolved.options.limit).toBeGreaterThanOrEqual(240);
  });

  it("keeps admin login on the auth bucket", () => {
    const resolved = resolveRateLimitScope("/api/admin/login");
    expect(resolved.scope).toBe("auth-api");
    expect(resolved.bucket).toBe("auth");
  });
});
