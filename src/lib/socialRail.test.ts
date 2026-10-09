import { describe, expect, it } from "vitest";
import { sanitizeSocialRailHref } from "@/lib/socialRail";

describe("sanitizeSocialRailHref", () => {
  it("rejects LinkedIn label with X.com URL", () => {
    expect(sanitizeSocialRailHref("linkedin", "https://x.com/")).toBe(
      "https://www.linkedin.com/company/vibemusic-india",
    );
  });

  it("keeps valid platform URLs", () => {
    expect(sanitizeSocialRailHref("instagram", "https://www.instagram.com/vibemusicindia")).toBe(
      "https://www.instagram.com/vibemusicindia",
    );
  });
});
