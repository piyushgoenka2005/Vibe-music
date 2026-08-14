import type { HomepageBannerSlide } from "@/data/homepageBannerHero";
import type { HomepageBanner } from "@/types/banner";

/** Map an admin banner row to a storefront hero slide. */
export function mapBannerToSlide(banner: HomepageBanner): HomepageBannerSlide {
  const alt =
    banner.subtitle?.trim()
      ? `${banner.title} — ${banner.subtitle}`
      : banner.title?.trim() || "Promotion at Vibe Music";

  return {
    id: `admin-banner-${banner.id}`,
    src: banner.image,
    mobileSrc: banner.mobileImage?.trim() || undefined,
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
        `${slide.id}|${slide.src}|${slide.mobileSrc ?? ""}|${slide.href}|${slide.title ?? ""}|${slide.subtitle ?? ""}|${slide.ctaText ?? ""}|${slide.updatedAt ?? ""}`
    )
    .join(";;");
}
