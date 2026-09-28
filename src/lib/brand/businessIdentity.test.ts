import { describe, expect, it } from "vitest";
import {
  CANONICAL_BUSINESS_ADDRESS,
  REGISTERED_BUSINESS_STATE,
} from "@/lib/brand/businessIdentity";
import { SELLER_STATE } from "@/lib/gstCalculator";

describe("businessIdentity", () => {
  it("uses Kolkata Room 303 as the canonical registered address", () => {
    expect(CANONICAL_BUSINESS_ADDRESS).toContain("Room 303");
    expect(CANONICAL_BUSINESS_ADDRESS).toContain("Kolkata");
    expect(CANONICAL_BUSINESS_ADDRESS).toContain("West Bengal");
  });

  it("aligns GST seller state with the registered address", () => {
    expect(REGISTERED_BUSINESS_STATE).toBe("West Bengal");
    expect(SELLER_STATE).toBe(REGISTERED_BUSINESS_STATE);
  });
});
