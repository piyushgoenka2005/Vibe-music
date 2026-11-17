import { describe, expect, it } from "vitest";
import {
  shouldPrioritizeHomepageProductImage,
  shouldPrioritizeNewArrivalImage,
} from "@/lib/performance/lcpBudget";

describe("lcpBudget", () => {
  it("defers below-the-fold homepage carousel cards so hero LCP loads first", () => {
    expect(shouldPrioritizeHomepageProductImage("trending", 0)).toBe(false);
    expect(shouldPrioritizeHomepageProductImage("trending", 7)).toBe(false);
    expect(shouldPrioritizeHomepageProductImage("trending", 12)).toBe(false);
    expect(shouldPrioritizeHomepageProductImage("best_sellers", 2)).toBe(false);
    expect(shouldPrioritizeHomepageProductImage("deals", 0)).toBe(false);
  });

  it("defers below-the-fold new arrival marquee cards including decorative clones", () => {
    expect(shouldPrioritizeNewArrivalImage(0, { decorative: true })).toBe(false);
    expect(shouldPrioritizeNewArrivalImage(0)).toBe(false);
    expect(shouldPrioritizeNewArrivalImage(1)).toBe(false);
  });
});
