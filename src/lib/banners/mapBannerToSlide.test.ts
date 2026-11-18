import { describe, expect, it } from "vitest";
import { mapBannerToSlide } from "@/lib/banners/mapBannerToSlide";
import type { HomepageBanner } from "@/types/banner";

const sampleBanner: HomepageBanner = {
  id: "banner-1",
  title: "Hertz HG 20",
  subtitle: "Feel every beat",
  image: "https://cdn.vibemusic.in/banners/desktop.webp",
  mobileImage: "https://cdn.vibemusic.in/banners/mobile.webp",
  ctaText: "Shop Hertz",
  ctaLink: "/search?brand=hertz",
  priority: 0,
  status: "active",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-02T00:00:00.000Z",
};

describe("mapBannerToSlide", () => {
  it("maps admin fields to storefront slide shape", () => {
    const slide = mapBannerToSlide(sampleBanner);
    expect(slide.id).toBe("admin-banner-banner-1");
    expect(slide.src).toBe(sampleBanner.image);
    expect(slide.mobileSrc).toBe(sampleBanner.mobileImage);
    expect(slide.href).toBe("/search?brand=hertz");
    expect(slide.title).toBe("Hertz HG 20");
    expect(slide.subtitle).toBe("Feel every beat");
    expect(slide.ctaText).toBe("Shop Hertz");
    expect(slide.alt).toContain("Hertz HG 20");
  });

  it("maps empty or omitted title, subtitle, and ctaText to undefined", () => {
    const minimalBanner: HomepageBanner = {
      id: "banner-2",
      image: "/hertz-hg-20.webp",
      priority: 1,
      status: "active",
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-02T00:00:00.000Z",
    };
    const slide = mapBannerToSlide(minimalBanner);
    expect(slide.title).toBeUndefined();
    expect(slide.subtitle).toBeUndefined();
    expect(slide.ctaText).toBeUndefined();
    expect(slide.alt).toBe("Promotion at Vibe Music");
  });

  it("maps videoUrl when provided and falls back safely if image is empty", () => {
    const videoBanner: HomepageBanner = {
      id: "banner-video-1",
      image: "",
      videoUrl: "https://cdn.vibemusic.in/videos/hero-jam.mp4",
      title: "Watch the Live Jam",
      ctaText: "Watch Now",
      priority: 0,
      status: "active",
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-02T00:00:00.000Z",
    };
    const slide = mapBannerToSlide(videoBanner);
    expect(slide.videoUrl).toBe("https://cdn.vibemusic.in/videos/hero-jam.mp4");
    expect(slide.src).toBe("/independence-day-special.png");
    expect(slide.title).toBe("Watch the Live Jam");
    expect(slide.ctaText).toBe("Watch Now");
  });
});
