import "server-only";

import {
  HOMEPAGE_BANNER_SLIDES,
  type HomepageBannerSlide,
} from "@/data/homepageBannerHero";
import { mapBannersToSlides } from "@/lib/banners/mapBannerToSlide";
import { listActiveBanners } from "@/lib/server/bannerRepository";

/** Active admin banners when configured; otherwise static approved slides. */
export async function resolveHomepageBannerSlides(): Promise<HomepageBannerSlide[]> {
  try {
    const banners = await listActiveBanners();
    if (banners.length > 0) {
      return mapBannersToSlides(banners);
    }
  } catch {
    /* fall back to static carousel */
  }
  return HOMEPAGE_BANNER_SLIDES;
}
