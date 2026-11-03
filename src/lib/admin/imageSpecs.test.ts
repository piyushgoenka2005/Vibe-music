import { describe, expect, it } from "vitest";
import { IMAGE_SPECS, imageSpecRatio, isNearImageSpecRatio } from "./imageSpecs";

describe("imageSpecRatio", () => {
  it("parses CSS aspect-ratio strings", () => {
    expect(imageSpecRatio("1 / 1")).toBe(1);
    expect(imageSpecRatio("16 / 9")).toBeCloseTo(16 / 9);
    expect(imageSpecRatio("1920 / 720")).toBeCloseTo(8 / 3);
  });

  it("falls back to a square for invalid input", () => {
    expect(imageSpecRatio("")).toBe(1);
    expect(imageSpecRatio("wide / tall")).toBe(1);
  });
});

describe("isNearImageSpecRatio", () => {
  it("accepts images within the tolerance", () => {
    expect(isNearImageSpecRatio(1000, 1000, IMAGE_SPECS.categoryStorefront)).toBe(true);
    expect(isNearImageSpecRatio(1600, 1200, IMAGE_SPECS.browseCategoryCard)).toBe(true);
  });

  it("rejects images that would be cropped", () => {
    expect(isNearImageSpecRatio(1920, 1080, IMAGE_SPECS.reelPoster)).toBe(false);
    expect(isNearImageSpecRatio(1200, 1600, IMAGE_SPECS.heroDesktop)).toBe(false);
  });

  it("treats unknown dimensions as acceptable", () => {
    expect(isNearImageSpecRatio(0, 0, IMAGE_SPECS.heroDesktop)).toBe(true);
  });
});
