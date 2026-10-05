import { beforeEach, describe, expect, it, vi } from "vitest";
import { resolveAuthoritativeShippingCharge } from "@/lib/server/shippingQuoteService";

vi.mock("@/lib/server/shippingZoneRepository", () => ({
  listShippingZones: vi.fn(async () => [
    {
      id: "rest-of-india",
      name: "Rest of India",
      states: [],
      pinCodePrefixes: [],
      methodCharges: { standard: 149 },
      freeShippingThreshold: 9999,
      isActive: true,
      sortOrder: 1,
      createdAt: "",
      updatedAt: "",
    },
  ]),
}));

vi.mock("@/lib/server/settingsService", () => ({
  getStoreSettings: vi.fn(async () => ({
    freeShippingThreshold: 9999,
    standardShippingCharge: 149,
  })),
}));

describe("resolveAuthoritativeShippingCharge", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns zone charge when below free-shipping threshold", async () => {
    const charge = await resolveAuthoritativeShippingCharge({
      method: "standard",
      subtotal: 5000,
      discount: 0,
      postalCode: "560001",
      state: "Karnataka",
    });
    expect(charge).toBe(149);
  });

  it("returns zero when subtotal qualifies for free shipping", async () => {
    const charge = await resolveAuthoritativeShippingCharge({
      method: "standard",
      subtotal: 12000,
      discount: 0,
      postalCode: "560001",
    });
    expect(charge).toBe(0);
  });
});
