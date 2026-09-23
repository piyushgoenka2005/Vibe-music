import { describe, expect, it } from "vitest";
import { buildSocialRailConfig, getDefaultSocialRailConfig } from "@/lib/socialRail";
import type { HomepageSection, HomepageSectionItem } from "@/types/homepage";

function makeSection(overrides: Partial<HomepageSection> = {}): HomepageSection {
  const timestamp = new Date(0).toISOString();
  return {
    id: "social_rail",
    sectionKey: "social_rail",
    title: "Social Rail",
    isActive: true,
    sortOrder: 11,
    sourceMode: "manual",
    maxItems: 10,
    layout: "social_rail",
    ctaText: "Newsletter",
    ctaLink: "#newsletter",
    createdAt: timestamp,
    updatedAt: timestamp,
    ...overrides,
  };
}

function makeItem(overrides: Partial<HomepageSectionItem>): HomepageSectionItem {
  const timestamp = new Date(0).toISOString();
  return {
    id: "item-1",
    sectionKey: "social_rail",
    sortOrder: 0,
    isActive: true,
    createdAt: timestamp,
    updatedAt: timestamp,
    ...overrides,
  };
}

describe("buildSocialRailConfig", () => {
  it("returns inactive config when section is disabled", () => {
    const config = buildSocialRailConfig(makeSection({ isActive: false }), []);
    expect(config.isActive).toBe(false);
    expect(config.links).toEqual([]);
    expect(config.newsletter).toBeNull();
  });

  it("maps active social items and newsletter settings", () => {
    const config = buildSocialRailConfig(makeSection(), [
      makeItem({
        id: "fb",
        customTitle: "facebook",
        customHref: "https://facebook.com/vibemusic",
      }),
      makeItem({
        id: "ig",
        customTitle: "instagram",
        customHref: "https://instagram.com/vibemusic",
        sortOrder: 1,
      }),
    ]);

    expect(config.isActive).toBe(true);
    expect(config.links).toEqual([
      {
        platform: "facebook",
        label: "Facebook",
        href: "https://facebook.com/vibemusic",
      },
      {
        platform: "instagram",
        label: "Instagram",
        href: "https://instagram.com/vibemusic",
      },
    ]);
    expect(config.newsletter).toEqual({
      label: "Newsletter",
      href: "#newsletter",
    });
  });

  it("falls back to defaults when no valid items exist", () => {
    const config = buildSocialRailConfig(makeSection(), []);
    expect(config.links).toEqual(getDefaultSocialRailConfig().links);
  });
});
