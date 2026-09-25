import { describe, expect, it } from "vitest";
import { buildProductSlug, slugify } from "@/lib/slug";

describe("buildProductSlug", () => {
  it("dedupes repeated brand tokens when the name already includes the brand", () => {
    expect(buildProductSlug("Hertz", "Hertz HZ STMP X")).toBe("hertz-hz-stmp-x");
    expect(buildProductSlug("Hertz", "Hertz Hertz HZ STMP X")).toBe("hertz-hz-stmp-x");
  });

  it("keeps brand prefix when the name does not repeat it", () => {
    expect(buildProductSlug("Hertz", "HZ STMP X")).toBe("hertz-hz-stmp-x");
    expect(buildProductSlug("Adeon", "AMS84F Stage Mixer")).toBe("adeon-ams84f-stage-mixer");
  });

  it("does not collapse legitimate repeated words in the product name", () => {
    expect(buildProductSlug("Pearl", "Tom Tom Stand")).toBe("pearl-tom-tom-stand");
  });

  it("matches slugify for explicit slugs passed through uniqueSlug callers", () => {
    expect(slugify("Hertz-Hertz HZ STMP X")).toBe("hertz-hertz-hz-stmp-x");
    expect(buildProductSlug("Hertz", "Hertz HZ STMP X")).not.toBe(slugify("Hertz-Hertz HZ STMP X"));
  });
});
