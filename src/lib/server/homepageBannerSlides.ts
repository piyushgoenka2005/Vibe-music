import "server-only";

import {
  HOMEPAGE_BANNER_SLIDES,
  type HomepageBannerSlide,
} from "@/data/homepageBannerHero";
import { listActiveBanners } from "@/lib/server/bannerRepository";
import type { HomepageBanner } from "@/types/banner";

function mapAdminBannerToSlide(banner: HomepageBanner): HomepageBannerSlide {
  const alt =
    banner.subtitle?.trim()
      ? `${banner.title} — ${banner.subtitle}`
      : banner.title?.trim() || "Promotion at Vibe Music";

  return {
    id: `admin-banner-${banner.id}`,
    src: banner.image,
    alt,
    href: banner.ctaLink?.trim() || "/search",
    objectPosition: "center center",
  };
}

/** Active admin banners when configured; otherwise static approved slides. */
export async function resolveHomepageBannerSlides(): Promise<HomepageBannerSlide[]> {
  try {
    const banners = await listActiveBanners();
    if (banners.length > 0) {
      return banners.map(mapAdminBannerToSlide);
    }
  } catch {
    /* fall back to static carousel */
  }
  return HOMEPAGE_BANNER_SLIDES;
}
