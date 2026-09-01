import { describe, expect, it, vi } from "vitest";

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

import { adminErrorResponse, AdminRateLimitError, AdminAuthError } from "./require-admin";

describe("adminErrorResponse", () => {
  it("returns 429 with rate limit headers for AdminRateLimitError", () => {
    const error = new AdminRateLimitError(200, 0, Date.now() + 60000);
    const response = adminErrorResponse(error);
    expect(response.status).toBe(429);
    expect(response.headers.get("X-RateLimit-Limit")).toBe("200");
    expect(response.headers.get("X-RateLimit-Remaining")).toBe("0");
  });

  it("returns 401 for AdminAuthError with 401", () => {
    const error = new AdminAuthError("Authentication required", 401);
    const response = adminErrorResponse(error);
    expect(response.status).toBe(401);
  });

  it("returns 403 for AdminAuthError with 403", () => {
    const error = new AdminAuthError("Insufficient permissions", 403);
    const response = adminErrorResponse(error);
    expect(response.status).toBe(403);
  });

  it("returns 500 for unknown errors", () => {
    const response = adminErrorResponse(new Error("something broke"));
    expect(response.status).toBe(500);
    const body = response.json() as unknown as Promise<{ error: string }>;
    return body.then((b) => {
      expect(b.error).toBe("Internal server error");
    });
  });

  it("adds request ID header when request provided", () => {
    const error = new AdminAuthError("Unauthorized", 401);
    const request = new Request("http://localhost/admin/test", {
      headers: { "x-request-id": "abc-123" },
    });
    const response = adminErrorResponse(error, request);
    expect(response.headers.get("x-request-id")).toBe("abc-123");
  });

  it("does not set request ID header when no request", () => {
    const error = new AdminAuthError("Unauthorized", 401);
    const response = adminErrorResponse(error);
    expect(response.headers.has("x-request-id")).toBe(false);
  });
});
