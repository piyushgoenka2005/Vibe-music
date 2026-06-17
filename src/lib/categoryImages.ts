import { POPULAR_CATEGORY_ITEMS } from "@/data/popularCategories";

/** Map bento / nav slugs to popular-category hrefs (paths may differ slightly). */
const SLUG_TO_HREF: Record<string, string> = {
  guitars: "/shop/guitars/",
  bass: "/shop/bass/",
  "studio-recording": "/shop/studio-recording/",
  "drums-percussion": "/shop/drums-percussion/",
  "keyboards-synthesizers": "/shop/keyboards-synthesizers/",
  "live-sound-lighting": "/shop/live-sound/",
  "live-sound": "/shop/live-sound/",
  "software-plug-ins": "/shop/software-plugins/",
  "software-plugins": "/shop/software-plugins/",
  "dj-equipment": "/shop/dj-equipment/",
};

const FALLBACK_IMAGE =
  "/images/m/home/cats/LPR59VOWCSNH.png?width=800&height=600&fit=cover&format=webp&quality=80";

const GRID_IMAGE_PARAMS = "width=200&height=200&fit=bounds&format=webp&quality=82";
const HERO_IMAGE_PARAMS = "width=800&height=600&fit=cover&format=webp&quality=80";

function hrefForCategorySlug(slug: string): string {
  const normalized = slug.toLowerCase();
  return SLUG_TO_HREF[normalized] ?? `/shop/${normalized}/`;
}

function imageFromPopularCategories(
  href: string,
  params: string
): string | undefined {
  const item = POPULAR_CATEGORY_ITEMS.find((category) => category.href === href);
  if (!item?.imageSrc) return undefined;
  const basePath = item.imageSrc.split("?")[0];
  return `${basePath}?${params}`;
}

/** Fallback hero when no Firestore banners are configured. */
export const MARKETING_HERO_IMAGE =
  "/images/m/products/image/d55a7ca800bRKFzzzI1LkoPdgD1ymbxu18tLjQgI.png?width=1200&height=900&fit=cover&format=webp&quality=85";

/** Editorial split section image. */
export const MARKETING_EDITORIAL_IMAGE =
  "/images/m/products/image/2cdf4bf761DZWztWMTXvRjefZynBO9RTcVrcDe0F.jpg?width=1000&height=700&fit=cover&format=webp&quality=85";

/** Grid / carousel category thumbnail (popular categories strip). */
export function getCategoryGridImage(slug: string): string {
  const href = hrefForCategorySlug(slug);
  return (
    imageFromPopularCategories(href, GRID_IMAGE_PARAMS) ??
    `${FALLBACK_IMAGE.split("?")[0]}?${GRID_IMAGE_PARAMS}`
  );
}

/** Hero-sized category image for bento tiles and marketing blocks. */
export function getCategoryHeroImage(slug: string): string {
  const href = hrefForCategorySlug(slug);
  return (
    imageFromPopularCategories(href, HERO_IMAGE_PARAMS) ??
    `${FALLBACK_IMAGE.split("?")[0]}?${HERO_IMAGE_PARAMS}`
  );
}
