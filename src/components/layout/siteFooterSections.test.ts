import { describe, expect, it } from "vitest";
import { FOOTER_FOLLOW_SECTION_ENABLED, buildFooterSections } from "./siteFooterSections";
import type { PublicLegalInfo } from "@/types/publicLegal";

describe("siteFooterSections", () => {
  const dummyLegal: PublicLegalInfo = {
    legalName: "Vibe Music Technologies Private Limited",
    address: "Kolkata, West Bengal, India",
    gstin: "19ABCDE1234F1Z5",
    grievanceEmail: "support@vibemusic.in",
  };

  it("has FOOTER_FOLLOW_SECTION_ENABLED enabled", () => {
    expect(FOOTER_FOLLOW_SECTION_ENABLED).toBe(true);
  });

  it("builds the '04 / Follow' section with working social links", () => {
    const sections = buildFooterSections(dummyLegal);
    const followSection = sections.find((s) => s.id === "follow");

    expect(followSection).toBeDefined();
    expect(followSection?.label).toBe("04 / Follow");

    const labels = followSection?.links.map((l) => l.label) ?? [];
    expect(labels).toContain("Instagram");
    expect(labels).toContain("YouTube");
    expect(labels).toContain("Facebook");
    expect(labels).toContain("LinkedIn");

    const instagramLink = followSection?.links.find((l) => l.label === "Instagram");
    expect(instagramLink?.href).toContain("instagram.com");
    expect(instagramLink?.external).toBe(true);

    const youtubeLink = followSection?.links.find((l) => l.label === "YouTube");
    expect(youtubeLink?.href).toContain("youtube.com");
    expect(youtubeLink?.external).toBe(true);
  });
});
