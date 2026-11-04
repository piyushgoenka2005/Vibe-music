import { getCachedHomepageProducts } from "@/lib/server/catalogSnapshotCache";
import { getSectionByKey, listActiveSectionItems } from "@/lib/server/homepage/homepageService";
import { MARKETING_HERO_SLIDES } from "@/data/marketingHeroSlides";
import PremiumHero from "@/components/home/PremiumHero";
import type { MarketingHeroSlide } from "@/data/marketingHeroSlides";
import { productPath } from "@/lib/routes";

export default async function PremiumHeroLive() {
  const section = await getSectionByKey("premium_hero");
  if (!section || !section.isActive) return null;

  const items = await listActiveSectionItems("premium_hero");
  if (items.length === 0) return <PremiumHero />;

  const products = await getCachedHomepageProducts();
  const slides: MarketingHeroSlide[] = items
    .slice(0, 4)
    .map((item) => {
      const product = item.productId ? products.find((entry) => entry.id === item.productId) : null;
      const title = item.customTitle || product?.name || "Featured gear";
      const image = item.customImage || product?.images[0];
      const href = item.customHref || (product ? productPath(product.slug) : "/search");

      return {
        src: image || MARKETING_HERO_SLIDES[0]?.src || "",
        alt: title,
        href,
        brand: product?.brand,
        title,
        description: item.offerText || product?.name || "",
        badge: item.badgeLabel,
        fit: "contain" as const,
      };
    })
    .filter((slide) => Boolean(slide.src && slide.href));

  return (
    <PremiumHero
      title={section.title}
      subtitle={section.subtitle}
      ctaText={section.ctaText}
      ctaLink={section.ctaLink}
      secondaryCtaText={section.secondaryCtaText}
      secondaryCtaLink={section.secondaryCtaLink}
      slides={slides.length > 0 ? slides : undefined}
    />
  );
}
