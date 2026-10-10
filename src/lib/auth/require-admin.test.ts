import { describe, expect, it, vi, beforeEach } from "vitest";
import type { Permission } from "@/types/admin";

// Mock dependencies
vi.mock("@/lib/auth/server-session", () => ({
  getSessionUser: vi.fn(),
}));

vi.mock("@/lib/server/adminService", () => ({
  getAdminSession: vi.fn(),
}));

vi.mock("@/lib/security/distributed-rate-limit", () => ({
  distributedCheckRateLimit: vi.fn(),
}));

vi.mock("@/lib/server/auditLog", () => ({
  logAuditEvent: vi.fn(),
}));

vi.mock("@/lib/auth/permissions", () => ({
  hasPermission: vi.fn(),
}));

vi.mock("@/lib/security/mutation-origin", () => ({
  isMutationMethod: vi.fn(),
}));

vi.mock("next/server", async (importOriginal) => ({
  ...(await importOriginal<typeof import("next/server")>()),
  after: vi.fn(),
}));

vi.mock("@/lib/server/storefront/storefrontCacheInvalidation", () => ({
  invalidateAllStorefrontCaches: vi.fn(),
  isStorefrontAdminWrite: (pathname: string) => pathname.startsWith("/api/admin/products"),
}));

import { after } from "next/server";
import { isMutationMethod } from "@/lib/security/mutation-origin";
import { requireAdmin, AdminAuthError, AdminRateLimitError } from "./require-admin";
import { getSessionUser } from "@/lib/auth/server-session";
import { getAdminSession } from "@/lib/server/adminService";
import { distributedCheckRateLimit } from "@/lib/security/distributed-rate-limit";
import { hasPermission } from "@/lib/auth/permissions";

describe("requireAdmin", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getSessionUser).mockResolvedValue({
      uid: "user-1",
      email: "test@test.com",
      name: null,
    });
    vi.mocked(getAdminSession).mockResolvedValue({
      uid: "admin-1",
      email: "admin@test.com",
      displayName: "Admin",
      role: "super_admin",
      permissions: [
        "products:read",
        "products:write",
        "orders:read",
        "orders:write",
      ] as Permission[],
    });
    vi.mocked(distributedCheckRateLimit).mockResolvedValue({
      allowed: true,
      remaining: 199,
      resetAt: Date.now() + 60000,
    });
    vi.mocked(hasPermission).mockReturnValue(true);
  });

  it("returns admin session when all checks pass", async () => {
    const session = await requireAdmin("products:read");
    expect(session.uid).toBe("admin-1");
  });

  it("throws AdminAuthError when not authenticated", async () => {
    vi.mocked(getSessionUser).mockResolvedValue(null);
    await expect(requireAdmin("products:read")).rejects.toThrow(AdminAuthError);
  });

  it("throws AdminAuthError when not admin", async () => {
    vi.mocked(getAdminSession).mockResolvedValue(null);
    await expect(requireAdmin("products:read")).rejects.toThrow(AdminAuthError);
  });

  it("throws AdminAuthError with 401 for unauthenticated", async () => {
    vi.mocked(getSessionUser).mockResolvedValue(null);
    try {
      await requireAdmin("products:read");
    } catch (e) {
      expect(e).toBeInstanceOf(AdminAuthError);
      expect((e as AdminAuthError).status).toBe(401);
    }
  });

  it("throws AdminAuthError with 403 for non-admin", async () => {
    vi.mocked(getAdminSession).mockResolvedValue(null);
    try {
      await requireAdmin("products:read");
    } catch (e) {
      expect(e).toBeInstanceOf(AdminAuthError);
      expect((e as AdminAuthError).status).toBe(403);
    }
  });

  it("throws AdminAuthError when permission denied", async () => {
    vi.mocked(hasPermission).mockReturnValue(false);
    try {
      await requireAdmin("admins:write");
    } catch (e) {
      expect(e).toBeInstanceOf(AdminAuthError);
      expect((e as AdminAuthError).status).toBe(403);
    }
  });

  it("throws AdminRateLimitError when rate limited", async () => {
    vi.mocked(distributedCheckRateLimit).mockResolvedValue({
      allowed: false,
      remaining: 0,
      resetAt: Date.now() + 60000,
    });

    const mockRequest = new Request("http://localhost/api/test", { method: "GET" });
    await expect(requireAdmin("products:read", mockRequest)).rejects.toThrow(AdminRateLimitError);
  });

  it("skips rate limiting when no request provided", async () => {
    await requireAdmin("products:read");
    expect(distributedCheckRateLimit).not.toHaveBeenCalled();
  });

  it("schedules a storefront cache refresh for storefront admin writes", async () => {
    vi.mocked(isMutationMethod).mockReturnValue(true);
    const request = new Request("http://localhost/api/admin/products/p1", { method: "PATCH" });
    await requireAdmin("products:write", request);
    expect(after).toHaveBeenCalledTimes(1);
  });

  it("does not refresh the storefront for operational writes or reads", async () => {
    vi.mocked(isMutationMethod).mockReturnValue(true);
    await requireAdmin(
      "orders:write",
      new Request("http://localhost/api/admin/orders/o1/status", { method: "PATCH" }),
    );
    vi.mocked(isMutationMethod).mockReturnValue(false);
    await requireAdmin(
      "products:read",
      new Request("http://localhost/api/admin/products", { method: "GET" }),
    );
    expect(after).not.toHaveBeenCalled();
  });
});
