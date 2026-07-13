import { describe, expect, it } from "vitest";
import {
  buildShippingQuotes,
  getZoneShippingCharge,
  matchShippingZone,
} from "@/lib/shipping/shippingZoneResolver";
import type { ShippingZone } from "@/types/shippingZone";

const zones: ShippingZone[] = [
  {
    id: "metro",
    name: "Metro",
    states: ["Maharashtra"],
    pinCodePrefixes: ["40"],
    methodCharges: { standard: 99, express: 199, overnight: 399 },
    freeShippingThreshold: 9999,
    isActive: true,
    sortOrder: 1,
    createdAt: "",
    updatedAt: "",
  },
  {
    id: "rest-of-india",
    name: "Rest of India",
    states: [],
    pinCodePrefixes: [],
    methodCharges: { standard: 149, express: 249, overnight: 499 },
    freeShippingThreshold: 9999,
    isActive: true,
    sortOrder: 2,
    createdAt: "",
    updatedAt: "",
  },
];

describe("shippingZoneResolver", () => {
  it("matches by pin code prefix", () => {
    const zone = matchShippingZone(zones, { postalCode: "400001" });
    expect(zone?.id).toBe("metro");
  });

  it("falls back to rest-of-india", () => {
    const zone = matchShippingZone(zones, { postalCode: "560001" });
    expect(zone?.id).toBe("rest-of-india");
  });

  it("applies free standard shipping above threshold", () => {
    const zone = zones[0];
    expect(getZoneShippingCharge("standard", 12000, 0, zone, 9999)).toBe(0);
  });

  it("builds standard shipping quotes for a zone", () => {
    const quotes = buildShippingQuotes(5000, 0, zones[0], 9999);
    expect(quotes).toHaveLength(1);
    expect(quotes[0]?.id).toBe("standard");
    expect(quotes[0]?.charge).toBe(99);
  });
});
