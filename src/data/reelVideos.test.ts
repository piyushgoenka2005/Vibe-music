import { describe, expect, it } from "vitest";
import {
  getMirroredReelVideoFallbackUrl,
  getMirroredReelVideoUrl,
  getReelVideoCandidateUrls,
} from "./reelVideos";

describe("reelVideos", () => {
  it("defaults to full-quality origin reels", () => {
    expect(getMirroredReelVideoUrl(0)).toBe("/videos/style-story/reel-1.mp4");
    expect(getMirroredReelVideoUrl(5)).toBe("/videos/style-story/reel-6.mp4");
  });

  it("exposes compressed variants when requested", () => {
    expect(getMirroredReelVideoUrl(0, true)).toBe("/videos/style-story/reel-1-opt.mp4");
  });

  it("exposes full-quality fallback URLs", () => {
    expect(getMirroredReelVideoFallbackUrl(0)).toBe("/videos/style-story/reel-1.mp4");
  });

  it("orders playback candidates with origin first", () => {
    const candidates = getReelVideoCandidateUrls(0);
    expect(candidates[0]).toBe("/videos/style-story/reel-1.mp4");
    expect(candidates).toContain("/videos/style-story/reel-1-opt.mp4");
  });
});
