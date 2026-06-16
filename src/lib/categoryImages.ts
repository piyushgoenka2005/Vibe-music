import { POPULAR_CATEGORY_ITEMS } from "@/data/popularCategories";

/** Map bento / nav slugs to popular-category hrefs (paths may differ slightly). */
const SLUG_TO_HREF: Record<string, string> = {
  guitars: "/shop/guitars/",
  "studio-recording": "/shop/studio-recording/",
  "drums-percussion": "/shop/drums-percussion/",
  "keyboards-synthesizers": "/shop/keyboards-synthesizers/",
  "live-sound-lighting": "/shop/live-sound/",
  "software-plug-ins": "/shop/software-plugins/",
};

const FALLBACK_IMAGE =
  "/images/m/home/cats/LPR59VOWCSNH.png?width=800&height=600&fit=cover&format=webp&quality=80";

/** Fallback hero when no Firestore banners are configured. */
export const MARKETING_HERO_IMAGE =
  "/images/m/products/image/d55a7ca800bRKFzzzI1LkoPdgD1ymbxu18tLjQgI.png?width=1200&height=900&fit=cover&format=webp&quality=85";

/** Editorial split section image. */
export const MARKETING_EDITORIAL_IMAGE =
  "/images/m/products/image/2cdf4bf761DZWztWMTXvRjefZynBO9RTcVrcDe0F.jpg?width=1000&height=700&fit=cover&format=webp&quality=85";

/** Hero-sized category image for bento tiles and marketing blocks. */
export function getCategoryHeroImage(slug: string): string {
  const href = SLUG_TO_HREF[slug];
  if (!href) return FALLBACK_IMAGE;

  const item = POPULAR_CATEGORY_ITEMS.find((category) => category.href === href);
  if (!item?.imageSrc) return FALLBACK_IMAGE;

  const basePath = item.imageSrc.split("?")[0];
  return `${basePath}?width=800&height=600&fit=cover&format=webp&quality=80`;
}
