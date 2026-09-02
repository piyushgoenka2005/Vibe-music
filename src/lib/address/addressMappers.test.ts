import { describe, expect, it } from "vitest";
import {
  addressToShipping,
  legacyAddressToInput,
  formatAddressLines,
  getAddressDisplayLabel,
} from "./addressMappers";
import type { Address, LegacySavedAddress } from "@/types/address";

const mockAddress: Address = {
  id: "addr_1",
  userId: "user_1",
  fullName: "Rahul Sharma",
  phone: "9876543210",
  addressLine1: "12 MG Road",
  addressLine2: "Near City Mall",
  city: "Mumbai",
  state: "Maharashtra",
  country: "India",
  postalCode: "400001",
  isDefault: true,
  label: "Home",
  createdAt: "2024-01-01",
  updatedAt: "2024-01-01",
};

const mockLegacyAddress: LegacySavedAddress = {
  id: "legacy_1",
  label: "Office",
  name: "Priya Patel",
  line1: "45 Park Street",
  line2: "Suite 200",
  city: "Kolkata",
  state: "West Bengal",
  postalCode: "700016",
  country: "India",
  isDefault: false,
};

describe("addressToShipping", () => {
  it("maps Address to ShippingAddress correctly", () => {
    const result = addressToShipping(mockAddress);
    expect(result).toEqual({
      name: "Rahul Sharma",
      line1: "12 MG Road",
      line2: "Near City Mall",
      city: "Mumbai",
      state: "Maharashtra",
      postalCode: "400001",
      country: "India",
      phone: "9876543210",
    });
  });

  it("handles address without line2", () => {
    const addr = { ...mockAddress, addressLine2: undefined };
    const result = addressToShipping(addr);
    expect(result.line2).toBeUndefined();
  });
});

describe("legacyAddressToInput", () => {
  it("maps legacy address to Address input format", () => {
    const result = legacyAddressToInput(mockLegacyAddress, "9999988888");
    expect(result.fullName).toBe("Priya Patel");
    expect(result.phone).toBe("9999988888");
    expect(result.addressLine1).toBe("45 Park Street");
    expect(result.addressLine2).toBe("Suite 200");
    expect(result.city).toBe("Kolkata");
    expect(result.state).toBe("West Bengal");
    expect(result.country).toBe("India");
    expect(result.postalCode).toBe("700016");
  });

  it("uses empty string as default phone fallback", () => {
    const result = legacyAddressToInput(mockLegacyAddress);
    expect(result.phone).toBe("");
  });

  it("does not include id, userId, createdAt, updatedAt", () => {
    const result = legacyAddressToInput(mockLegacyAddress, "123");
    expect(result).not.toHaveProperty("id");
    expect(result).not.toHaveProperty("userId");
    expect(result).not.toHaveProperty("createdAt");
    expect(result).not.toHaveProperty("updatedAt");
  });
});

describe("formatAddressLines", () => {
  it("formats full address as newline-separated string", () => {
    const result = formatAddressLines(mockAddress);
    expect(result).toContain("Rahul Sharma");
    expect(result).toContain("12 MG Road");
    expect(result).toContain("Near City Mall");
    expect(result).toContain("Mumbai, Maharashtra 400001");
    expect(result).toContain("India");
    expect(result).toContain("Phone: 9876543210");
  });

  it("omits phone when not provided", () => {
    const addr = { ...mockAddress, phone: "" };
    const result = formatAddressLines(addr);
    expect(result).not.toContain("Phone:");
  });

  it("omits line2 when not provided", () => {
    const addr = { ...mockAddress, addressLine2: undefined };
    const result = formatAddressLines(addr);
    expect(result).not.toContain("Near City Mall");
  });
});

describe("getAddressDisplayLabel", () => {
  it("returns label when present", () => {
    expect(getAddressDisplayLabel(mockAddress)).toBe("Home");
  });

  it("returns 'Address' when label is missing", () => {
    const addr = { ...mockAddress, label: undefined };
    expect(getAddressDisplayLabel(addr)).toBe("Address");
  });

  it("returns 'Address' when label is empty string", () => {
    const addr = { ...mockAddress, label: "  " };
    expect(getAddressDisplayLabel(addr)).toBe("Address");
  });
});
