import { describe, expect, it } from "vitest";
import {
  shouldPrioritizeHomepageProductImage,
  shouldPrioritizeNewArrivalImage,
} from "@/lib/performance/lcpBudget";

describe("lcpBudget", () => {
  it("only prioritizes the first trending carousel card", () => {
    expect(shouldPrioritizeHomepageProductImage("trending", 0)).toBe(true);
    expect(shouldPrioritizeHomepageProductImage("trending", 1)).toBe(false);
    expect(shouldPrioritizeHomepageProductImage("staff_picks", 0)).toBe(false);
  });

  it("skips decorative marquee clones", () => {
    expect(
      shouldPrioritizeNewArrivalImage(0, { decorative: true })
    ).toBe(false);
    expect(shouldPrioritizeNewArrivalImage(0)).toBe(true);
    expect(shouldPrioritizeNewArrivalImage(1)).toBe(false);
  });
});
