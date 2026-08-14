import { describe, expect, it } from "vitest";
import { mapBannerToSlide, slidesFingerprint } from "@/lib/banners/mapBannerToSlide";
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

  it("fingerprints slide order and content for live refresh keys", () => {
    const a = slidesFingerprint([mapBannerToSlide(sampleBanner)]);
    const b = slidesFingerprint([
      mapBannerToSlide({ ...sampleBanner, title: "Updated title" }),
    ]);
    expect(a).not.toBe(b);
  });
});
