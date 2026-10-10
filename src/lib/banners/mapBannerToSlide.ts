import type { HomepageBannerSlide } from "@/data/homepageBannerHero";
import { sanitizeStorefrontImageUrl } from "@/lib/storefront/coerceSecureAssetUrl";
import type { HomepageBanner } from "@/types/banner";

/** Map an admin banner row to a storefront hero slide. */
export function mapBannerToSlide(banner: HomepageBanner): HomepageBannerSlide {
  const alt = banner.subtitle?.trim()
    ? `${banner.title} — ${banner.subtitle}`
    : banner.title?.trim() || "Promotion at Vibe Music";

  const src = sanitizeStorefrontImageUrl(banner.image) || banner.image;
  const mobileRaw = banner.mobileImage?.trim();
  const mobileSrc = mobileRaw ? sanitizeStorefrontImageUrl(mobileRaw) || mobileRaw : undefined;

  return {
    id: `admin-banner-${banner.id}`,
    src,
    mobileSrc,
    alt,
    href: banner.ctaLink?.trim() || "/search",
    title: banner.title?.trim() || undefined,
    subtitle: banner.subtitle?.trim() || undefined,
    ctaText: banner.ctaText?.trim() || undefined,
    objectPosition: "center center",
    updatedAt: banner.updatedAt,
  };
}

export function mapBannersToSlides(banners: HomepageBanner[]): HomepageBannerSlide[] {
  return banners.map(mapBannerToSlide);
}

/** Stable fingerprint for client-side slide diffing (order + content). */
export function slidesFingerprint(slides: HomepageBannerSlide[]): string {
  return slides
    .map(
      (slide) =>
        `${slide.id}|${slide.src}|${slide.srcOptimized ?? ""}|${slide.mobileSrc ?? ""}|${slide.href}|${slide.title ?? ""}|${slide.subtitle ?? ""}|${slide.ctaText ?? ""}|${slide.updatedAt ?? ""}`,
    )
    .join(";;");
}
