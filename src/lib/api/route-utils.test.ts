import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("@/lib/security/distributed-rate-limit", () => ({
  distributedCheckRateLimit: vi.fn(),
}));

vi.mock("@/lib/security/mutation-origin", () => ({
  isMutationMethod: vi.fn(),
  isWebhookPath: vi.fn(),
  verifyMutationOrigin: vi.fn(),
}));

vi.mock("@/lib/security/request-log", () => ({
  getRequestId: vi.fn(() => "test-req-id"),
}));

vi.mock("@/lib/server/errorMonitoring", () => ({
  reportServerError: vi.fn(),
}));

vi.mock("@/lib/server/logger", () => ({
  logInfo: vi.fn(),
}));

import {
  jsonError,
  notFoundResponse,
  enforceRateLimit,
  enforceMutationSecurity,
  parseJsonBody,
  handleRouteError,
  withApiGuards,
} from "./route-utils";
import { distributedCheckRateLimit } from "@/lib/security/distributed-rate-limit";
import { isMutationMethod, verifyMutationOrigin } from "@/lib/security/mutation-origin";
import { z } from "zod";

describe("route-utils", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("jsonError", () => {
    it("returns JSON error with correct status", async () => {
      const response = jsonError("Not found", 404);
      expect(response.status).toBe(404);
      const body = await response.json();
      expect(body.error).toBe("Not found");
    });

    it("returns 500 for server errors", async () => {
      const response = jsonError("Internal server error", 500);
      expect(response.status).toBe(500);
    });
  });

  describe("notFoundResponse", () => {
    it("returns 404 with default message", async () => {
      const response = notFoundResponse();
      expect(response.status).toBe(404);
      const body = await response.json();
      expect(body.error).toBe("Resource not found");
    });

    it("returns 404 with custom resource name", async () => {
      const response = notFoundResponse("Product");
      const body = await response.json();
      expect(body.error).toBe("Product not found");
    });
  });

  describe("enforceRateLimit", () => {
    it("returns null when under limit", async () => {
      vi.mocked(distributedCheckRateLimit).mockResolvedValue({
        allowed: true,
        remaining: 119,
        resetAt: Date.now() + 60000,
      });
      const request = new Request("http://localhost/api/test");
      const result = await enforceRateLimit(request, "test");
      expect(result).toBeNull();
    });

    it("returns 429 when over limit", async () => {
      vi.mocked(distributedCheckRateLimit).mockResolvedValue({
        allowed: false,
        remaining: 0,
        resetAt: Date.now() + 60000,
      });
      const request = new Request("http://localhost/api/test");
      const result = await enforceRateLimit(request, "test");
      expect(result).not.toBeNull();
      expect(result!.status).toBe(429);
      expect(result!.headers.get("X-RateLimit-Remaining")).toBe("0");
    });
  });

  describe("enforceMutationSecurity", () => {
    it("allows GET requests", () => {
      vi.mocked(isMutationMethod).mockReturnValue(false);
      const request = new Request("http://localhost/api/test", { method: "GET" });
      expect(enforceMutationSecurity(request)).toBeNull();
    });

    it("blocks mutations with bad origin", () => {
      vi.mocked(isMutationMethod).mockReturnValue(true);
      vi.mocked(verifyMutationOrigin).mockReturnValue(false);
      const request = new Request("http://localhost/api/test", { method: "POST" });
      const result = enforceMutationSecurity(request);
      expect(result).not.toBeNull();
      expect(result!.status).toBe(403);
    });

    it("allows valid mutations", () => {
      vi.mocked(isMutationMethod).mockReturnValue(true);
      vi.mocked(verifyMutationOrigin).mockReturnValue(true);
      const request = new Request("http://localhost/api/test", { method: "POST" });
      expect(enforceMutationSecurity(request)).toBeNull();
    });
  });

  describe("parseJsonBody", () => {
    it("parses valid JSON body", async () => {
      const schema = z.object({ name: z.string() });
      const request = new Request("http://localhost/api/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "test" }),
      });
      const result = await parseJsonBody(request, schema);
      expect("data" in result).toBe(true);
      if ("data" in result) expect(result.data.name).toBe("test");
    });

    it("returns 400 for invalid JSON", async () => {
      const schema = z.object({ name: z.string() });
      const request = new Request("http://localhost/api/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "not json",
      });
      const result = await parseJsonBody(request, schema);
      expect("error" in result).toBe(true);
      if ("error" in result) expect(result.error.status).toBe(400);
    });

    it("returns 400 for validation failure", async () => {
      const schema = z.object({ name: z.string().min(1) });
      const request = new Request("http://localhost/api/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "" }),
      });
      const result = await parseJsonBody(request, schema);
      expect("error" in result).toBe(true);
      if ("error" in result) expect(result.error.status).toBe(400);
    });
  });

  describe("handleRouteError", () => {
    it("returns 500 for unknown errors", () => {
      const response = handleRouteError(new Error("oops"), "test");
      expect(response.status).toBe(500);
    });

    it("returns 404 for not-found errors", () => {
      const response = handleRouteError(
        new Error("Product not found"),
        "test"
      );
      expect(response.status).toBe(404);
    });

    it("returns 403 for permission errors", () => {
      const response = handleRouteError(
        new Error("Access denied"),
        "test"
      );
      expect(response.status).toBe(403);
    });

    it("adds request ID header when request provided", () => {
      const request = new Request("http://localhost/api/test");
      const response = handleRouteError(new Error("oops"), "test", request);
      expect(response.headers.get("x-request-id")).toBe("test-req-id");
    });
  });

  describe("withApiGuards", () => {
    it("calls handler and returns response", async () => {
      vi.mocked(distributedCheckRateLimit).mockResolvedValue({
        allowed: true,
        remaining: 119,
        resetAt: Date.now() + 60000,
      });
      vi.mocked(isMutationMethod).mockReturnValue(false);

      const request = new Request("http://localhost/api/test");
      const response = await withApiGuards(
        request,
        { context: "test", scope: "test" },
        async () => jsonError("ok", 200)
      );
      expect(response.status).toBe(200);
    });

    it("returns rate limit error when over limit", async () => {
      vi.mocked(distributedCheckRateLimit).mockResolvedValue({
        allowed: false,
        remaining: 0,
        resetAt: Date.now() + 60000,
      });

      const request = new Request("http://localhost/api/test");
      const response = await withApiGuards(
        request,
        { context: "test", scope: "test" },
        async () => jsonError("ok", 200)
      );
      expect(response.status).toBe(429);
    });

    it("catches handler errors", async () => {
      vi.mocked(distributedCheckRateLimit).mockResolvedValue({
        allowed: true,
        remaining: 119,
        resetAt: Date.now() + 60000,
      });
      vi.mocked(isMutationMethod).mockReturnValue(false);

      const request = new Request("http://localhost/api/test");
      const response = await withApiGuards(
        request,
        { context: "test", scope: "test" },
        async () => {
          throw new Error("boom");
        }
      );
      expect(response.status).toBe(500);
    });
  });
});
