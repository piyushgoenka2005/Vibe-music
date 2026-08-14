"use client";

import HomepageBannerHero from "@/components/home/homepage-banner-hero/HomepageBannerHero";
import type { HomepageBannerSlide } from "@/data/homepageBannerHero";
import { useHomepageBanners } from "@/hooks/useHomepageBanners";

interface HomepageBannerHeroLiveProps {
  initialSlides: HomepageBannerSlide[];
}

/** Client wrapper — polls `/api/banners` so admin edits appear without a full reload. */
export default function HomepageBannerHeroLive({
  initialSlides,
}: HomepageBannerHeroLiveProps) {
  const { slides, fingerprint } = useHomepageBanners(initialSlides);
  return <HomepageBannerHero key={fingerprint} slides={slides} />;
}
