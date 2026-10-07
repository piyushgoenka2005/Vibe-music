import { describe, expect, it } from "vitest";
import {
  MAX_COUPON_PRODUCT_URLS,
  parseProductSlugFromInput,
  parseProductSlugList,
} from "@/lib/coupons/parseProductUrl";

describe("parseProductSlugFromInput", () => {
  it("parses full product URLs", () => {
    expect(parseProductSlugFromInput("https://vibemusic.in/product/fender-stratocaster")).toBe(
      "fender-stratocaster",
    );
  });

  it("parses relative product paths", () => {
    expect(parseProductSlugFromInput("/product/yamaha-p125")).toBe("yamaha-p125");
  });

  it("accepts bare slugs", () => {
    expect(parseProductSlugFromInput("roland-fp30x")).toBe("roland-fp30x");
  });

  it("returns null for invalid input", () => {
    expect(parseProductSlugFromInput("not a valid slug!!!")).toBeNull();
  });
});

describe("parseProductSlugList", () => {
  it("dedupes and caps at max URLs", () => {
    const lines = Array.from({ length: 12 }, (_, i) => `https://vibemusic.in/product/p-${i}`);
    const slugs = parseProductSlugList(lines.join("\n"));
    expect(slugs).toHaveLength(MAX_COUPON_PRODUCT_URLS);
  });

  it("handles comma-separated paste", () => {
    expect(parseProductSlugList("https://vibemusic.in/product/a, /product/b, c")).toEqual([
      "a",
      "b",
      "c",
    ]);
  });
});
