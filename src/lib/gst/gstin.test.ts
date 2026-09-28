import { describe, expect, it } from "vitest";
import { gstStateCodeFromGstin, isValidGstin, panFromGstin } from "@/lib/gst/gstin";

describe("gstin helpers", () => {
  const sample = "27AABCU9603R1ZM";

  it("validates Indian GSTIN format", () => {
    expect(isValidGstin(sample)).toBe(true);
    expect(isValidGstin("invalid")).toBe(false);
    expect(isValidGstin("")).toBe(false);
  });

  it("extracts state code from GSTIN", () => {
    expect(gstStateCodeFromGstin(sample)).toBe("27");
    expect(gstStateCodeFromGstin("bad")).toBe("");
  });

  it("extracts PAN from GSTIN", () => {
    expect(panFromGstin(sample)).toBe("AABCU9603R");
    expect(panFromGstin(undefined)).toBeUndefined();
  });
});
