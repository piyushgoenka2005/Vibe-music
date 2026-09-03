import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getCouponByCode,
  validateCoupon,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  incrementCouponUsage,
  listCoupons,
  listActiveCouponsForStorefront,
} from "@/lib/server/couponService";
import * as pg from "@/lib/server/prisma/contentRepository";

vi.mock("@/lib/server/prisma/contentRepository", () => ({
  countCoupons: vi.fn(),
  createCouponRecord: vi.fn(),
  getCouponByCode: vi.fn(),
  listCouponPage: vi.fn(),
  updateCouponRecord: vi.fn(),
  deleteCouponRecord: vi.fn(),
  incrementCouponUsageRecord: vi.fn(),
}));

describe("couponService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getCouponByCode", () => {
    it("returns database coupon when found in postgres", async () => {
      const mockCoupon = {
        id: "c1",
        code: "CUSTOM20",
        label: "20% off",
        type: "percentage" as const,
        value: 20,
        usedCount: 0,
        isActive: true,
        createdAt: "2026-01-01",
        updatedAt: "2026-01-01",
      };
      vi.mocked(pg.getCouponByCode).mockResolvedValue(mockCoupon);

      const result = await getCouponByCode("custom20");
      expect(pg.getCouponByCode).toHaveBeenCalledWith("CUSTOM20");
      expect(result).toEqual(mockCoupon);
    });

    it("falls back to static coupon template if not in postgres", async () => {
      vi.mocked(pg.getCouponByCode).mockResolvedValue(null);

      const result = await getCouponByCode("save10");
      expect(result).not.toBeNull();
      expect(result?.code).toBe("SAVE10");
      expect(result?.value).toBe(10);
      expect(result?.type).toBe("percentage");
    });

    it("returns null for unknown coupon code", async () => {
      vi.mocked(pg.getCouponByCode).mockResolvedValue(null);

      const result = await getCouponByCode("NONEXISTENT");
      expect(result).toBeNull();
    });
  });

  describe("validateCoupon", () => {
    it("returns error for invalid coupon code", async () => {
      vi.mocked(pg.getCouponByCode).mockResolvedValue(null);

      const res = await validateCoupon("BADCODE", 1000);
      expect(res.valid).toBe(false);
      expect(res.error).toBe("Invalid coupon code");
    });

    it("validates a static coupon successfully against subtotal", async () => {
      vi.mocked(pg.getCouponByCode).mockResolvedValue(null);

      const res = await validateCoupon("SAVE10", 2000);
      expect(res.valid).toBe(true);
      expect(res.discount).toBe(200);
      expect(res.coupon?.code).toBe("SAVE10");
    });

    it("enforces minimum order amount requirement", async () => {
      const mockCoupon = {
        id: "c2",
        code: "MIN5000",
        label: "Flat ₹500 off",
        type: "flat" as const,
        value: 500,
        minOrderAmount: 5000,
        usedCount: 0,
        isActive: true,
        createdAt: "2026-01-01",
        updatedAt: "2026-01-01",
      };
      vi.mocked(pg.getCouponByCode).mockResolvedValue(mockCoupon);

      const failure = await validateCoupon("MIN5000", 3000);
      expect(failure.valid).toBe(false);
      expect(failure.error).toMatch(/minimum/i);

      const success = await validateCoupon("MIN5000", 6000);
      expect(success.valid).toBe(true);
      expect(success.discount).toBe(500);
    });
  });

  describe("createCoupon / updateCoupon / deleteCoupon / incrementUsage", () => {
    it("creates a coupon with uppercase code and timestamps", async () => {
      const input = {
        code: "summer25",
        label: "Summer 25%",
        type: "percentage" as const,
        value: 25,
        isActive: true,
      };

      vi.mocked(pg.createCouponRecord).mockImplementation(async (record) => record);

      const created = await createCoupon(input);
      expect(created.code).toBe("SUMMER25");
      expect(created.usedCount).toBe(0);
      expect(pg.createCouponRecord).toHaveBeenCalled();
    });

    it("delegates updateCoupon to postgres repository", async () => {
      const updated = {
        id: "c1",
        code: "SUMMER25",
        label: "Summer 30%",
        type: "percentage" as const,
        value: 30,
        usedCount: 1,
        isActive: true,
        createdAt: "2026-01-01",
        updatedAt: "2026-01-02",
      };
      vi.mocked(pg.updateCouponRecord).mockResolvedValue(updated);

      const res = await updateCoupon("c1", { value: 30, label: "Summer 30%" });
      expect(res).toEqual(updated);
      expect(pg.updateCouponRecord).toHaveBeenCalledWith("c1", { value: 30, label: "Summer 30%" });
    });

    it("delegates deleteCoupon to repository", async () => {
      vi.mocked(pg.deleteCouponRecord).mockResolvedValue();
      await deleteCoupon("c1");
      expect(pg.deleteCouponRecord).toHaveBeenCalledWith("c1");
    });

    it("delegates incrementCouponUsage to repository", async () => {
      vi.mocked(pg.incrementCouponUsageRecord).mockResolvedValue();
      await incrementCouponUsage("SAVE10");
      expect(pg.incrementCouponUsageRecord).toHaveBeenCalledWith("SAVE10");
    });
  });

  describe("listCoupons & listActiveCouponsForStorefront", () => {
    it("seeds default coupons if table count is 0", async () => {
      vi.mocked(pg.countCoupons).mockResolvedValue(0);
      vi.mocked(pg.createCouponRecord).mockImplementation(async (r) => r);
      vi.mocked(pg.listCouponPage).mockResolvedValue({ coupons: [], hasMore: false });

      await listCoupons({ limit: 10 });
      expect(pg.createCouponRecord).toHaveBeenCalledTimes(3);
    });

    it("filters storefront offers by schedule and active status", async () => {
      const now = new Date("2026-06-15T12:00:00Z");
      const coupons = [
        {
          id: "1",
          code: "ACTIVE1",
          label: "Active",
          type: "percentage" as const,
          value: 10,
          isActive: true,
          usedCount: 0,
          createdAt: "2026-01-01",
          updatedAt: "2026-01-01",
        },
        {
          id: "2",
          code: "INACTIVE",
          label: "Inactive",
          type: "percentage" as const,
          value: 15,
          isActive: false,
          usedCount: 0,
          createdAt: "2026-01-01",
          updatedAt: "2026-01-01",
        },
        {
          id: "3",
          code: "EXPIRED",
          label: "Expired",
          type: "percentage" as const,
          value: 20,
          isActive: true,
          expiresAt: "2026-01-01T00:00:00Z",
          usedCount: 0,
          createdAt: "2026-01-01",
          updatedAt: "2026-01-01",
        },
      ];

      vi.mocked(pg.countCoupons).mockResolvedValue(3);
      vi.mocked(pg.listCouponPage).mockResolvedValue({ coupons, hasMore: false });

      const offers = await listActiveCouponsForStorefront(now);
      expect(offers).toHaveLength(1);
      expect(offers[0].code).toBe("ACTIVE1");
    });
  });
});
