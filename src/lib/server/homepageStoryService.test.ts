import { describe, expect, it, vi } from "vitest";
import { getHomepageStoryBanners } from "@/lib/server/homepageStoryService";
import * as homepageRepo from "@/lib/server/homepageRepository";

describe("getHomepageStoryBanners", () => {
  it("returns default approved story banners when no database items exist", async () => {
    vi.spyOn(homepageRepo, "getSectionByKey").mockResolvedValueOnce(null);
    vi.spyOn(homepageRepo, "listSectionItems").mockResolvedValueOnce([]);

    const data = await getHomepageStoryBanners();
    expect(data.isActive).toBe(true);
    expect(data.banners.length).toBeGreaterThan(0);
    expect(data.banners[0].imageAlt).toBe("An integrated coil-tap for total tonal freedom");
    expect(data.banners[0].imageSrc).toBe("/images/guitar-1.webp");
  });

  it("returns isActive: false when section is toggled inactive in admin", async () => {
    vi.spyOn(homepageRepo, "getSectionByKey").mockResolvedValueOnce({
      id: "featured_stories",
      sectionKey: "featured_stories",
      title: "Featured Gear Stories",
      isActive: false,
      sortOrder: 8,
      sourceMode: "manual",
      maxItems: 8,
      layout: "story_banners",
      createdAt: "",
      updatedAt: "",
    });

    const data = await getHomepageStoryBanners();
    expect(data.isActive).toBe(false);
    expect(data.banners).toEqual([]);
  });

  it("returns custom admin-configured story banners when present", async () => {
    vi.spyOn(homepageRepo, "getSectionByKey").mockResolvedValueOnce({
      id: "featured_stories",
      sectionKey: "featured_stories",
      title: "Custom Gear Stories",
      isActive: true,
      sortOrder: 8,
      sourceMode: "manual",
      maxItems: 8,
      layout: "story_banners",
      createdAt: "",
      updatedAt: "",
    });

    vi.spyOn(homepageRepo, "listSectionItems").mockResolvedValueOnce([
      {
        id: "banner-custom-1",
        sectionKey: "featured_stories",
        sortOrder: 0,
        isActive: true,
        customImage: "https://cdn.vibemusic.in/custom-banner.webp",
        customTitle: "Updated Custom Guitar Story",
        customHref: "/category/electric-guitars",
        createdAt: "",
        updatedAt: "",
      },
    ]);

    const data = await getHomepageStoryBanners();
    expect(data.isActive).toBe(true);
    expect(data.sectionTitle).toBe("Custom Gear Stories");
    expect(data.banners).toHaveLength(1);
    expect(data.banners[0]).toEqual({
      id: "banner-custom-1",
      imageSrc: "https://cdn.vibemusic.in/custom-banner.webp",
      imageAlt: "Updated Custom Guitar Story",
      href: "/category/electric-guitars",
    });
  });
});
