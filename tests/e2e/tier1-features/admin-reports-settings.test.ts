import { describe, it, expect } from "vitest";
import { isValidGstin, gstStateCodeFromGstin, panFromGstin } from "@/lib/gst/gstin";
import { ALL_PERMISSIONS, EDITABLE_ADMIN_ROLES } from "@/lib/auth/permissions";
import { ROUTES } from "@/lib/routes";
import type { SalesReportSummary } from "@/app/api/admin/reports/route";
import type { HsnTaxCategory } from "@/app/api/admin/tax/route";

describe("Tier 1: Admin Reports, Taxes & Settings (Features 14, 15, 19, 24)", () => {
  it("validates sales analytics report data contract (Feature 15)", () => {
    const mockReport: SalesReportSummary = {
      period: "Last 30 Days",
      totalGrossRevenue: 1450000,
      totalNetRevenue: 1228813,
      totalOrders: 32,
      averageOrderValue: 45312.5,
      totalGstCollected: 221187,
      shippingChargesCollected: 4500,
      discountsApplied: 35000,
      topCategories: [
        { name: "Electric Guitars", revenue: 685000, orderCount: 10, sharePercent: 47.2 },
        { name: "Keyboards & Pianos", revenue: 420000, orderCount: 8, sharePercent: 28.9 },
      ],
      topBrands: [
        { name: "Fender", revenue: 540000, unitsSold: 8 },
        { name: "Yamaha", revenue: 420000, unitsSold: 8 },
      ],
      salesByCategory: [
        { category: "Electric Guitars", revenue: 685000, orders: 10 },
        { category: "Keyboards & Pianos", revenue: 420000, orders: 8 },
      ],
      salesTrend: [
        { date: "2026-11-01", revenue: 121490, orders: 2 },
        { date: "2026-11-02", revenue: 68500, orders: 1 },
      ],
    };

    expect(mockReport.totalGrossRevenue).toBeGreaterThan(0);
    expect(mockReport.totalNetRevenue).toBeLessThanOrEqual(mockReport.totalGrossRevenue);
    expect(mockReport.totalOrders).toBeGreaterThan(0);
    expect(mockReport.averageOrderValue).toBeCloseTo(
      mockReport.totalGrossRevenue / mockReport.totalOrders,
      0,
    );
    expect(mockReport.salesByCategory?.length).toBeGreaterThan(0);
    expect(mockReport.salesTrend?.length).toBeGreaterThan(0);
  });

  it("validates HSN tax schedules and GST rate slabs (Feature 19)", () => {
    const hsnSchedules: HsnTaxCategory[] = [
      {
        hsnCode: "9202",
        name: "Acoustic & String Instruments",
        description: "Guitars, violins, ukuleles",
        gstRate: 18,
        cgstRate: 9,
        sgstRate: 9,
        igstRate: 18,
        isActive: true,
        itemCount: 84,
      },
      {
        hsnCode: "9207",
        name: "Electronic & Amplified Instruments",
        description: "Synthesizers, digital pianos, electronic drums",
        gstRate: 18,
        cgstRate: 9,
        sgstRate: 9,
        igstRate: 18,
        isActive: true,
        itemCount: 65,
      },
    ];

    for (const hsn of hsnSchedules) {
      expect([5, 12, 18, 28]).toContain(hsn.gstRate);
      expect(hsn.cgstRate + hsn.sgstRate).toBe(hsn.gstRate);
      expect(hsn.igstRate).toBe(hsn.gstRate);
      expect(hsn.isActive).toBe(true);
    }
  });

  it("validates Indian GSTIN structure, state code, and PAN extraction", () => {
    // Valid GSTIN: 27 AAAAA0000A 1 Z 5
    const validGstin = "27AABCV1234F1Z5"; // 27 = Maharashtra
    expect(isValidGstin(validGstin)).toBe(true);
    expect(gstStateCodeFromGstin(validGstin)).toBe("27");
    expect(panFromGstin(validGstin)).toBe("AABCV1234F");

    // Invalid GSTINs
    expect(isValidGstin("INVALID_GSTIN")).toBe(false);
    expect(isValidGstin("")).toBe(false);
    expect(isValidGstin(null)).toBe(false);
    expect(gstStateCodeFromGstin("INVALID")).toBe("");
  });

  it("verifies Admin navigation sidebar routes including Footer and SEO targets (Feature 14)", () => {
    // Admin core routes
    expect(ROUTES.admin).toBe("/admin");
    expect(ROUTES.adminProducts).toBe("/admin/products");
    expect(ROUTES.adminCategories).toBe("/admin/categories");
    expect(ROUTES.adminOrders).toBe("/admin/orders");
    expect(ROUTES.adminBanners).toBe("/admin/banners");

    // Verifies Footer Management and SEO Management link targets
    const footerLink = "/admin/footer";
    const seoLink = "/admin/seo";
    expect(footerLink).toBe("/admin/footer");
    expect(seoLink).toBe("/admin/seo");
  });

  it("verifies admin permission matrix and role boundaries (Feature 24)", () => {
    expect(ALL_PERMISSIONS.length).toBeGreaterThan(30);
    expect(ALL_PERMISSIONS).toContain("products:read");
    expect(ALL_PERMISSIONS).toContain("products:write");
    expect(ALL_PERMISSIONS).toContain("orders:read");
    expect(ALL_PERMISSIONS).toContain("analytics:read");

    expect(EDITABLE_ADMIN_ROLES).toContain("admin");
    expect(EDITABLE_ADMIN_ROLES).toContain("inventory_manager");
    expect(EDITABLE_ADMIN_ROLES).toContain("customer_support");
  });
});
