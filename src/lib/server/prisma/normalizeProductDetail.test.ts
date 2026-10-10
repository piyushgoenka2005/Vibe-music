import { describe, expect, it } from "vitest";
import { normalizeProductDetail } from "./mappers";

describe("normalizeProductDetail", () => {
  it("treats missing or empty detail as absent so a default is rebuilt", () => {
    expect(normalizeProductDetail(null)).toBeUndefined();
    expect(normalizeProductDetail({})).toBeUndefined();
    expect(normalizeProductDetail([])).toBeUndefined();
    expect(normalizeProductDetail("x")).toBeUndefined();
  });

  it("adds an empty specs list to partial detail objects", () => {
    expect(normalizeProductDetail({ msrp: 12000, variants: [] })).toEqual({
      msrp: 12000,
      variants: [],
      specs: [],
    });
  });

  it("keeps existing specs untouched", () => {
    const specs = [{ label: "Body", value: "Okoume" }];
    expect(normalizeProductDetail({ specs, msrp: null })).toEqual({ specs, msrp: null });
  });
});
