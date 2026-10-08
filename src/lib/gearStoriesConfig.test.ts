import { describe, expect, it } from "vitest";
import { buildGearStoriesConfig, buildGearStoryFromItem } from "@/lib/gearStoriesConfig";
import type { HomepageSection, HomepageSectionItem } from "@/types/homepage";

const section: HomepageSection = {
  id: "gear-stories",
  sectionKey: "gear_stories",
  title: "Gear style stories",
  subtitle: "Discover instruments in action.",
  isActive: true,
  sortOrder: 11,
  sourceMode: "manual",
  maxItems: 12,
  layout: "gear_stories_reels",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

describe("gearStoriesConfig", () => {
  it("builds reel cards from homepage items", () => {
    const items: HomepageSectionItem[] = [
      {
        id: "reel-1",
        sectionKey: "gear_stories",
        sortOrder: 0,
        isActive: true,
        customTitle: "Live drums",
        customImage: "/images/drum-1.webp",
        customHref: "/videos/style-story/reel-1.mp4",
        badgeLabel: "@vibemusicindia",
        offerText: "https://www.instagram.com/vibemusicindia/",
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
      },
    ];

    const config = buildGearStoriesConfig(section, items);
    expect(config.isActive).toBe(true);
    expect(config.stories).toHaveLength(1);
    expect(config.stories[0]?.videoUrl).toBe("/videos/style-story/reel-1.mp4");
    expect(config.stories[0]?.instagramHandle).toBe("@vibemusicindia");
  });

  it("uses only the admin video URL for playback candidates", () => {
    const story = buildGearStoryFromItem(
      {
        id: "custom-reel",
        sectionKey: "gear_stories",
        sortOrder: 0,
        isActive: true,
        customTitle: "Custom reel",
        customHref: "https://cdn.vibemusic.in/videos/custom.mp4",
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
      },
      99,
    );

    expect(story?.videoCandidates).toEqual(["https://cdn.vibemusic.in/videos/custom.mp4"]);
  });

  it("returns no stories when the section is active but items are empty", () => {
    const config = buildGearStoriesConfig(section, []);
    expect(config.isActive).toBe(false);
    expect(config.stories).toEqual([]);
  });

  it("maps optional modal copy from admin-only fields", () => {
    const story = buildGearStoryFromItem(
      {
        id: "copy-reel",
        sectionKey: "gear_stories",
        sortOrder: 0,
        isActive: true,
        customTitle: "Studio kit",
        customHref: "/videos/style-story/reel-2.mp4",
        categorySlug: "Built for live sessions.",
        brandId: "Maple neck\nRosewood fretboard",
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
      },
      0,
    );

    expect(story?.description).toBe("Built for live sessions.");
    expect(story?.features).toEqual(["Maple neck", "Rosewood fretboard"]);
    expect(story?.videoCandidates).toEqual([
      "/videos/style-story/reel-2.mp4",
      "/videos/style-story/reel-2-opt.mp4",
    ]);
  });

  it("skips items without a video URL", () => {
    const story = buildGearStoryFromItem(
      {
        id: "broken",
        sectionKey: "gear_stories",
        sortOrder: 0,
        isActive: true,
        customTitle: "Missing video",
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
      },
      0,
    );
    expect(story).toBeNull();
  });
});
