import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/server/settingsService", () => ({
  getStoreSettings: vi.fn(),
}));

import { getInvoiceSellerMeta } from "@/features/invoice/server/sellerMeta";
import { getStoreSettings } from "@/lib/server/settingsService";

describe("getInvoiceSellerMeta", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getStoreSettings).mockResolvedValue({
      storeName: "Vibe Music",
      storeAddress: "Kolkata",
      storeEmail: "support@vibemusic.in",
      storePhone: "8910482950",
      gstNumber: "27AABCU9603R1ZM",
      sellerState: "West Bengal",
      defaultGstRate: 18,
      freeShippingThreshold: 0,
      standardShippingCharge: 0,
      razorpayEnabled: true,
      updatedAt: "2026-01-01T00:00:00.000Z",
    });
  });

  it("derives stateCode and PAN from GSTIN", async () => {
    const meta = await getInvoiceSellerMeta();
    expect(meta.stateCode).toBe("27");
    expect(meta.pan).toBe("AABCU9603R");
    expect(meta.gstin).toBe("27AABCU9603R1ZM");
  });
});
