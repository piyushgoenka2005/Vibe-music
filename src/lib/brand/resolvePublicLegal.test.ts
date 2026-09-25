import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/server/settingsService", () => ({
  getStoreSettings: vi.fn(),
}));

import { getStoreSettings } from "@/lib/server/settingsService";
import { resolvePublicLegal } from "./resolvePublicLegal";

describe("resolvePublicLegal (L-30)", () => {
  beforeEach(() => {
    vi.mocked(getStoreSettings).mockReset();
  });

  it("prefers store settings over build-time BRAND defaults", async () => {
    vi.mocked(getStoreSettings).mockResolvedValue({
      storeName: "Sikkim Commerce House Pvt Ltd",
      storeAddress: "Kolkata",
      gstNumber: "19AABCU9603R1ZM",
      storeEmail: "",
      storePhone: "",
      defaultGstRate: 18,
      sellerState: "West Bengal",
      freeShippingThreshold: 0,
      standardShippingCharge: 0,
      razorpayEnabled: true,
      updatedAt: new Date().toISOString(),
    });

    const legal = await resolvePublicLegal();
    expect(legal.legalName).toBe("Sikkim Commerce House Pvt Ltd");
    expect(legal.gstin).toBe("19AABCU9603R1ZM");
  });

  it("falls back to BRAND when store settings omit GSTIN", async () => {
    vi.mocked(getStoreSettings).mockResolvedValue({
      storeName: "",
      storeAddress: "",
      gstNumber: "",
      storeEmail: "",
      storePhone: "",
      defaultGstRate: 18,
      sellerState: "West Bengal",
      freeShippingThreshold: 0,
      standardShippingCharge: 0,
      razorpayEnabled: true,
      updatedAt: new Date().toISOString(),
    });

    const legal = await resolvePublicLegal();
    expect(legal.legalName).toBe("Vibe Music");
    expect(legal.address).toContain("Kolkata");
  });
});
