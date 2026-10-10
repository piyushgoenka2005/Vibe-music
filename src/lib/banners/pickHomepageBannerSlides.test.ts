import { describe, expect, it } from "vitest";
import { HOMEPAGE_BANNER_SLIDES } from "@/data/homepageBannerHero";
import { pickHomepageBannerSlides } from "@/lib/banners/pickHomepageBannerSlides";

const adminSlide = {
  id: "admin-banner-1",
  src: "https://cdn.vibemusic.in/banners/homepage/test.webp",
  alt: "Admin banner",
  href: "/search",
};

describe("pickHomepageBannerSlides", () => {
  it("uses fetched slides when non-empty", () => {
    const fetched = [adminSlide, { ...adminSlide, id: "admin-banner-2" }];
    expect(pickHomepageBannerSlides(fetched, [])).toEqual(fetched);
  });

  it("keeps SSR admin slides when API returns an empty list", () => {
    expect(pickHomepageBannerSlides([], [adminSlide])).toEqual([adminSlide]);
  });

  it("falls back to static carousel only when both API and SSR are empty", () => {
    expect(pickHomepageBannerSlides([], [])).toEqual(HOMEPAGE_BANNER_SLIDES);
    expect(pickHomepageBannerSlides(undefined, [])).toEqual(HOMEPAGE_BANNER_SLIDES);
  });

  it("uses initial slides before fetch completes", () => {
    expect(pickHomepageBannerSlides(undefined, [adminSlide])).toEqual([adminSlide]);
  });
});
