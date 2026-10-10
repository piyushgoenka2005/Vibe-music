import { HOMEPAGE_BANNER_SLIDES, type HomepageBannerSlide } from "@/data/homepageBannerHero";

/**
 * Prefer fresh API slides when non-empty. An empty `/api/banners` payload must not
 * replace SSR admin slides (stale CDN, transient DB, or cached error responses).
 */
export function pickHomepageBannerSlides(
  fetched: HomepageBannerSlide[] | undefined,
  initialSlides: HomepageBannerSlide[],
): HomepageBannerSlide[] {
  if (fetched !== undefined) {
    if (fetched.length > 0) return fetched;
    if (initialSlides.length > 0) return initialSlides;
    return HOMEPAGE_BANNER_SLIDES;
  }
  if (initialSlides.length > 0) return initialSlides;
  return HOMEPAGE_BANNER_SLIDES;
}
