import { describe, expect, it } from "vitest";
import { getCategoryGridImage, getCategoryHeroImage } from "@/lib/categoryImages";

describe("category art for browse cards", () => {
  it("uses the amplifier artwork for the amplifiers category tile", () => {
    expect(getCategoryHeroImage("amplifiers")).toBe("/Hertz Amplifiers in a Warm Studio.png");
    expect(getCategoryGridImage("amplifiers")).toBe("/Hertz Amplifiers in a Warm Studio.png");
  });
});
