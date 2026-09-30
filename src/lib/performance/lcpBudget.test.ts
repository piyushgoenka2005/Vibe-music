import { describe, expect, it } from "vitest";
import {
  shouldPrioritizeHomepageProductImage,
  shouldPrioritizeNewArrivalImage,
} from "@/lib/performance/lcpBudget";

describe("lcpBudget", () => {
  it("prioritizes visible trending carousel cards", () => {
    expect(shouldPrioritizeHomepageProductImage("trending", 0)).toBe(true);
    expect(shouldPrioritizeHomepageProductImage("trending", 7)).toBe(true);
    expect(shouldPrioritizeHomepageProductImage("trending", 8)).toBe(false);
    expect(shouldPrioritizeHomepageProductImage("best_sellers", 2)).toBe(true);
    expect(shouldPrioritizeHomepageProductImage("deals", 0)).toBe(false);
  });

  it("skips decorative marquee clones", () => {
    expect(shouldPrioritizeNewArrivalImage(0, { decorative: true })).toBe(false);
    expect(shouldPrioritizeNewArrivalImage(0)).toBe(true);
    expect(shouldPrioritizeNewArrivalImage(1)).toBe(false);
  });
});
