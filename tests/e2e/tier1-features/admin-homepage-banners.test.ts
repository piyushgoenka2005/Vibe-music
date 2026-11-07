import { describe, it, expect } from "vitest";
import {
  adminBannerSchema,
  adminBannerReorderSchema,
  adminHomepageSectionSchema,
  adminHomepageSectionItemSchema,
  assertGearStoryItemPayload,
} from "@/lib/validations/admin";

describe("Tier 1: Admin Homepage Sections & Banner Merchandising (Feature 22)", () => {
  it("validates banner creation with desktop/mobile images and priority ordering", () => {
    const validBanner = {
      title: "Monsoon Guitar Fest",
      subtitle: "Up to 30% Off Fender, Ibanez, and PRS",
      image: "https://cdn.vibemusic.in/banners/monsoon-fest-desktop.jpg",
      mobileImage: "https://cdn.vibemusic.in/banners/monsoon-fest-mobile.jpg",
      ctaText: "Shop Guitars",
      ctaLink: "/category/electric-guitars",
      priority: 1,
      status: "active" as const,
    };

    const result = adminBannerSchema.safeParse(validBanner);
    expect(result.success).toBe(true);
  });

  it("rejects malicious or javascript: URLs in banner CTA links", () => {
    const maliciousBanner = {
      title: "Exploit Banner",
      image: "https://cdn.vibemusic.in/banners/test.jpg",
      ctaLink: "javascript:alert(document.cookie)",
      status: "active" as const,
    };

    expect(adminBannerSchema.safeParse(maliciousBanner).success).toBe(false);
  });

  it("validates banner reorder payload schema", () => {
    const validReorder = {
      orderedIds: ["banner-hero-1", "banner-fest-2", "banner-clearance-3"],
    };
    expect(adminBannerReorderSchema.safeParse(validReorder).success).toBe(true);

    const emptyReorder = { orderedIds: [] };
    expect(adminBannerReorderSchema.safeParse(emptyReorder).success).toBe(false);
  });

  it("validates homepage section layout types and curated item schemas", () => {
    const validSection = {
      title: "Featured Deals",
      subtitle: "Hand-picked studio essentials",
      layout: "product_grid" as const,
      maxItems: 8,
      sourceMode: "manual" as const,
      isActive: true,
      sortOrder: 2,
    };
    expect(adminHomepageSectionSchema.safeParse(validSection).success).toBe(true);

    const validItem = {
      sectionKey: "deals_of_the_day" as const,
      productId: "prod-fender-strat",
      sortOrder: 1,
      isActive: true,
      badgeLabel: "15% Off",
    };
    expect(adminHomepageSectionItemSchema.safeParse(validItem).success).toBe(true);
  });

  it("enforces gear stories reels payload requirements (video URL + reel title)", () => {
    // Valid gear story payload
    expect(() =>
      assertGearStoryItemPayload("gear_stories", {
        customHref: "https://cdn.vibemusic.in/videos/strat-tone-demo.mp4",
        customTitle: "Tone Test: Fender Player Series",
      }),
    ).not.toThrow();

    // Missing video URL throws
    expect(() =>
      assertGearStoryItemPayload("gear_stories", {
        customHref: "",
        customTitle: "Missing video link",
      }),
    ).toThrow(/Video URL is required/);

    // Missing title throws
    expect(() =>
      assertGearStoryItemPayload("gear_stories", {
        customHref: "https://cdn.vibemusic.in/videos/demo.mp4",
        customTitle: "",
      }),
    ).toThrow(/Reel title is required/);
  });
});
