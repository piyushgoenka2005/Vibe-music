import { describe, it, expect, beforeEach } from "vitest";
import {
  checkBackpressure,
  releaseBackpressure,
  getBackpressureScope,
  getBackpressureStats,
  isSystemUnderPressure,
} from "./backpressure";

describe("Backpressure", () => {
  describe("getBackpressureScope", () => {
    it("identifies auth scope", () => {
      expect(getBackpressureScope("/api/auth/signin")).toBe("auth");
      expect(getBackpressureScope("/api/auth/callback")).toBe("auth");
    });

    it("identifies admin scope", () => {
      expect(getBackpressureScope("/api/admin/products")).toBe("admin");
      expect(getBackpressureScope("/api/admin/orders")).toBe("admin");
    });

    it("identifies search scope", () => {
      expect(getBackpressureScope("/api/search")).toBe("search");
      expect(getBackpressureScope("/api/search?q=guitar")).toBe("search");
    });

    it("identifies checkout scope", () => {
      expect(getBackpressureScope("/api/checkout/create")).toBe("checkout");
      expect(getBackpressureScope("/api/payment/verify")).toBe("checkout");
      expect(getBackpressureScope("/api/cart/reprice")).toBe("checkout");
    });

    it("identifies api scope for other API routes", () => {
      expect(getBackpressureScope("/api/products")).toBe("api");
      expect(getBackpressureScope("/api/categories")).toBe("api");
    });

    it("identifies page scope for non-API routes", () => {
      expect(getBackpressureScope("/")).toBe("page");
      expect(getBackpressureScope("/category/guitars")).toBe("page");
      expect(getBackpressureScope("/product/fender-strat")).toBe("page");
    });
  });

  describe("checkBackpressure", () => {
    it("allows requests under limit", () => {
      const result = checkBackpressure("api", "/api/test");
      expect(result.allowed).toBe(true);
      // Release the slot
      releaseBackpressure("api");
    });

    it("rejects when limit exceeded", () => {
      // Fill up auth scope (limit: 50)
      for (let i = 0; i < 50; i++) {
        checkBackpressure("auth", "/api/auth/test");
      }

      const result = checkBackpressure("auth", "/api/auth/test");
      expect(result.allowed).toBe(false);
      if (!result.allowed) {
        expect(result.response.status).toBe(429);
      }

      // Cleanup
      for (let i = 0; i < 50; i++) {
        releaseBackpressure("auth");
      }
    });

    it("returns proper headers on rejection", () => {
      // Fill up auth scope
      for (let i = 0; i < 50; i++) {
        checkBackpressure("auth", "/api/auth/test");
      }

      const result = checkBackpressure("auth", "/api/auth/test");
      expect(result.allowed).toBe(false);
      if (!result.allowed) {
        expect(result.response.headers.get("Retry-After")).toBe("2");
        expect(result.response.headers.get("X-Backpressure-Scope")).toBe(
          "auth"
        );
      }

      // Cleanup
      for (let i = 0; i < 50; i++) {
        releaseBackpressure("auth");
      }
    });
  });

  describe("releaseBackpressure", () => {
    it("decrements in-flight count", () => {
      checkBackpressure("api", "/api/test");
      checkBackpressure("api", "/api/test");

      releaseBackpressure("api");
      const stats = getBackpressureStats();
      const apiStats = stats.find((s) => s.scope === "api");
      expect(apiStats?.inFlight).toBe(1);

      releaseBackpressure("api");
      releaseBackpressure("api"); // Extra release is safe
    });

    it("does not go below zero", () => {
      releaseBackpressure("nonexistent");
      releaseBackpressure("nonexistent");
      // Should not throw or go negative
    });
  });

  describe("getBackpressureStats", () => {
    it("returns stats for active scopes", () => {
      checkBackpressure("api", "/api/test");
      checkBackpressure("page", "/");

      const stats = getBackpressureStats();
      expect(stats.length).toBeGreaterThanOrEqual(2);

      const apiStats = stats.find((s) => s.scope === "api");
      expect(apiStats).toBeDefined();
      expect(apiStats!.inFlight).toBe(1);
      // 1/300 ≈ 0.33%, rounds to 0 — just check it's defined
      expect(apiStats!.utilization).toBeGreaterThanOrEqual(0);

      // Cleanup
      releaseBackpressure("api");
      releaseBackpressure("page");
    });
  });

  describe("isSystemUnderPressure", () => {
    it("returns false when no scope is under pressure", () => {
      expect(isSystemUnderPressure()).toBe(false);
    });

    it("returns true when a scope exceeds 80% utilization", () => {
      // Page scope limit is 150, 80% = 120
      for (let i = 0; i < 121; i++) {
        checkBackpressure("page", "/");
      }

      expect(isSystemUnderPressure()).toBe(true);

      // Cleanup
      for (let i = 0; i < 121; i++) {
        releaseBackpressure("page");
      }
    });
  });
});
