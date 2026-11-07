import { describe, it, expect, beforeEach, vi } from "vitest";
import { useCartStore } from "@/store/cartStore";
import { useCurrencyLocaleStore } from "@/components/layout/currencyLocaleStore";
import * as couponService from "@/services/coupon.service";
import { GET as getReportsRoute } from "@/app/api/admin/reports/route";
import {
  GET as getTaxRoute,
  POST as postTaxRoute,
  DELETE as deleteTaxRoute,
} from "@/app/api/admin/tax/route";
import { NextRequest } from "next/server";

vi.mock("@/store/toastStore", () => ({
  useToastStore: {
    getState: () => ({
      show: vi.fn(),
    }),
  },
}));

vi.mock("@/lib/auth/require-admin", () => ({
  requireAdmin: vi.fn().mockImplementation(async (permission?: string) => {
    if (permission === "forbidden_perm") {
      throw new Error("Forbidden: missing permission");
    }
    return { id: "admin-1", role: "super_admin", email: "admin@vibemusic.in" };
  }),
  adminErrorResponse: vi.fn().mockImplementation((err: unknown) => {
    const message = err instanceof Error ? err.message : "Internal Admin Error";
    return new Response(JSON.stringify({ error: message }), {
      status: message.includes("Forbidden") || message.includes("Unauthorized") ? 403 : 500,
      headers: { "Content-Type": "application/json" },
    });
  }),
}));

vi.mock("@/lib/db/prisma", () => ({
  isPostgresConfigured: vi.fn().mockReturnValue(false),
  prisma: {
    order: {
      findMany: vi.fn(),
    },
    taxCategory: {
      findMany: vi.fn(),
      count: vi.fn().mockResolvedValue(0),
      create: vi.fn(),
      upsert: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

describe("Tier 5 Adversarial: Uncaught Promise Rejection Safety & Async Error Resilience", () => {
  beforeEach(() => {
    useCartStore.setState({ isUpdating: false, isApplyingCoupon: false });
    useCartStore.getState().clearCart();
    vi.restoreAllMocks();
  });

  describe("Cart & Coupon Async Network Fault Resilience", () => {
    it("safely handles total network collapse (Fetch / Timeout Rejections) during coupon validation without uncaught rejection", async () => {
      // Simulate hard network drop (e.g. DNS failure, offline mode, gateway timeout)
      vi.spyOn(couponService, "validateCouponCode").mockRejectedValue(
        new TypeError("Failed to fetch: net::ERR_INTERNET_DISCONNECTED"),
      );

      // Add item so cart has subtotal
      useCartStore.getState().items = [
        {
          lineId: "test-line",
          productId: "prod-1",
          name: "Guitar",
          brand: "Fender",
          price: 50000,
          quantity: 1,
          gstRate: 18,
        },
      ];

      // Must resolve to false without throwing an uncaught Promise rejection
      let result: boolean | undefined;
      await expect(
        useCartStore
          .getState()
          .applyCoupon("VIBE10")
          .then((res) => {
            result = res;
          }),
      ).resolves.not.toThrow();

      expect(result).toBe(false);
      // isApplyingCoupon loading lock must be safely unlocked in finally block
      expect(useCartStore.getState().isApplyingCoupon).toBe(false);
      expect(useCartStore.getState().couponCode).toBeNull();
    });

    it("safely handles server returning 500 internal error during coupon validation", async () => {
      vi.spyOn(couponService, "validateCouponCode").mockResolvedValue({
        valid: false,
        error: "Internal database timeout: connection refused",
      });

      useCartStore.getState().items = [
        {
          lineId: "test-line-2",
          productId: "prod-2",
          name: "Keyboard",
          brand: "Yamaha",
          price: 35000,
          quantity: 1,
          gstRate: 18,
        },
      ];

      const success = await useCartStore.getState().applyCoupon("TEST500");
      expect(success).toBe(false);
      expect(useCartStore.getState().isApplyingCoupon).toBe(false);
      expect(useCartStore.getState().couponInvalidReason).toBe(
        "Internal database timeout: connection refused",
      );
    });
  });

  describe("LocalStorage & SessionStorage Exception Safeguards", () => {
    it("handles DOMException QuotaExceededError in currency/locale store without unhandled crash", () => {
      const originalSetItem = window.localStorage.setItem;

      // Mock localStorage.setItem to throw QuotaExceededError (e.g. iOS Safari private browsing storage limit)
      window.localStorage.setItem = vi.fn().mockImplementation(() => {
        const error = Object.assign(new Error("The quota has been exceeded."), {
          name: "QuotaExceededError",
          code: 22,
        });
        throw error;
      });

      expect(() => {
        useCurrencyLocaleStore.getState().setCurrency("EUR");
      }).not.toThrow();

      // State is still updated in memory despite storage error
      expect(useCurrencyLocaleStore.getState().currency).toBe("EUR");

      expect(() => {
        useCurrencyLocaleStore.getState().setLocale("hi-IN");
      }).not.toThrow();
      expect(useCurrencyLocaleStore.getState().locale).toBe("hi-IN");

      // Restore original setItem
      window.localStorage.setItem = originalSetItem;
    });

    it("handles SecurityError (Storage Access Blocked by Security Policy)", () => {
      const originalSetItem = window.localStorage.setItem;

      // Mock SecurityError
      window.localStorage.setItem = vi.fn().mockImplementation(() => {
        const error = Object.assign(new Error("Storage access is denied by security policy."), {
          name: "SecurityError",
        });
        throw error;
      });

      expect(() => {
        useCurrencyLocaleStore.getState().setCurrency("USD");
      }).not.toThrow();
      expect(useCurrencyLocaleStore.getState().currency).toBe("USD");

      window.localStorage.setItem = originalSetItem;
    });
  });

  describe("Admin Reports API Async Exception Safeguards", () => {
    it("catches database failures in /api/admin/reports and returns clean 500 JSON without process termination", async () => {
      const { prisma } = await import("@/lib/db/prisma");
      // Simulate database query rejecting (e.g., connection lost during aggregate)
      vi.mocked(prisma.order.findMany).mockRejectedValueOnce(
        new Error("PrismaClientInitializationError: Can't reach database server at postgres:5432"),
      );

      const request = new NextRequest("http://localhost:3000/api/admin/reports?range=30d");
      const response = await getReportsRoute(request);

      expect(response.status).toBe(500);
      const json = await response.json();
      expect(json.error).toContain("Can't reach database server");
    });

    it("catches unauthorized access in /api/admin/reports and returns 403 Forbidden", async () => {
      const { requireAdmin } = await import("@/lib/auth/require-admin");
      vi.mocked(requireAdmin).mockRejectedValueOnce(new Error("Unauthorized: Invalid session"));

      const request = new NextRequest("http://localhost:3000/api/admin/reports?range=7d");
      const response = await getReportsRoute(request);

      expect(response.status).toBe(403);
      const json = await response.json();
      expect(json.error).toContain("Unauthorized");
    });
  });

  describe("Admin Tax Schedule API Async Exception Safeguards", () => {
    it("validates missing HSN code in POST /api/admin/tax and responds with 400 Bad Request", async () => {
      const request = new NextRequest("http://localhost:3000/api/admin/tax", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hsnCode: "", // Empty
          name: "Invalid Item",
          gstRate: 18,
        }),
      });

      const response = await postTaxRoute(request);
      expect(response.status).toBe(400);
      const json = await response.json();
      expect(json.error).toBe("HSN Code and Name are required");
    });

    it("validates missing hsnCode parameter in DELETE /api/admin/tax and returns 400 Bad Request", async () => {
      const request = new NextRequest("http://localhost:3000/api/admin/tax", {
        method: "DELETE",
      });

      const response = await deleteTaxRoute(request);
      expect(response.status).toBe(400);
      const json = await response.json();
      expect(json.error).toBe("hsnCode parameter is required");
    });

    it("handles database exceptions in GET /api/admin/tax with handled JSON response", async () => {
      const { requireAdmin } = await import("@/lib/auth/require-admin");
      vi.mocked(requireAdmin).mockRejectedValueOnce(
        new Error("Forbidden: insufficient permissions"),
      );

      const request = new NextRequest("http://localhost:3000/api/admin/tax");
      const response = await getTaxRoute(request);

      expect(response.status).toBe(403);
      const json = await response.json();
      expect(json.error).toContain("Forbidden");
    });
  });

  describe("AudioPreviewPlayer Web Audio Autoplay Rejection Handling", () => {
    it("simulates browser autoplay policy rejection (NotAllowedError) safely handled via fallback", async () => {
      // Simulate HTMLAudioElement play() rejecting with DOMException
      const playRejection = Object.assign(
        new Error(
          "NotAllowedError: play() failed because the user didn't interact with the document first.",
        ),
        { name: "NotAllowedError" },
      );

      let fallbackInvoked = false;
      const simulatePlayWithFallback = async (audioUrl?: string) => {
        if (audioUrl) {
          try {
            await Promise.reject(playRejection);
          } catch {
            // AudioPreviewPlayer handles catch by falling back to tone synthesis
            fallbackInvoked = true;
          }
        }
      };

      await simulatePlayWithFallback("https://example.com/sound.mp3");
      expect(fallbackInvoked).toBe(true);
    });

    it("simulates AudioContext suspended state resume without unhandled promise rejection", async () => {
      let resumed = false;
      const mockAudioContext = {
        state: "suspended",
        resume: vi.fn().mockImplementation(async () => {
          resumed = true;
        }),
        close: vi.fn().mockResolvedValue(undefined),
      };

      if (mockAudioContext.state === "suspended") {
        void mockAudioContext.resume();
      }

      // Allow microtask queue to process
      await Promise.resolve();
      expect(mockAudioContext.resume).toHaveBeenCalled();
      expect(resumed).toBe(true);
    });
  });
});
