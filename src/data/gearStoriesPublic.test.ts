import { describe, expect, it } from "vitest";
import { getPublicGearStories } from "./gearStoriesPublic";

describe("getPublicGearStories", () => {
  it("returns static stories without async catalog work", () => {
    const section = getPublicGearStories();
    expect(section.title).toBe("Gear style stories");
    expect(section.subtitle).toBe("Discover instruments in action.");
    expect(section.stories.length).toBe(6);
    expect(section.stories[0]?.videoUrl).toBe("/videos/style-story/reel-1.mp4");
    expect(section.stories[0]?.posterUrl).toBeTruthy();
  });
});
