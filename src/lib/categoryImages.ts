import { POPULAR_CATEGORY_ITEMS } from "@/data/popularCategories";
import { categoryPath } from "@/lib/routes";

/** Map bento / nav slugs to popular-category hrefs. */
const SLUG_TO_HREF: Record<string, string> = {
  guitars: categoryPath("guitars"),
  bass: categoryPath("bass"),
  "studio-recording": categoryPath("studio-recording"),
  "drums-percussion": categoryPath("drums-percussion"),
  "keyboards-synthesizers": categoryPath("keyboards-synthesizers"),
  "live-sound-lighting": categoryPath("live-sound-lighting"),
  "live-sound": categoryPath("live-sound-lighting"),
  "software-plug-ins": categoryPath("software-plug-ins"),
  "software-plugins": categoryPath("software-plug-ins"),
  "dj-equipment": categoryPath("dj-equipment"),
  "cables-cases-accessories": categoryPath("cables-cases-accessories"),
  "microphones-wireless": categoryPath("microphones-wireless"),
  "band-orchestra": categoryPath("band-orchestra"),
  "home-audio-electronics": categoryPath("home-audio-electronics"),
  "commercial-audio-installation": categoryPath("commercial-audio-installation"),
  "video-cameras": categoryPath("video-cameras"),
};

const FALLBACK_IMAGE =
  "/images/m/home/cats/LPR59VOWCSNH.png?width=800&height=600&fit=cover&format=webp&quality=80";

const GRID_IMAGE_PARAMS = "width=200&height=200&fit=bounds&format=webp&quality=82";
const HERO_IMAGE_PARAMS = "width=800&height=600&fit=cover&format=webp&quality=80";

const GUITAR_MEGA_ELECTRIC_IMAGE =
  "https://res.cloudinary.com/piyushgoenka/image/upload/c_fill,w_800,h_600,g_center,q_82,f_auto/v1782292639/products/guitars/hertz-hzr-4002e-hzr-4002e/03-hza-4001-e-na-amazonfnt.png";
const GUITAR_MEGA_ACOUSTIC_IMAGE =
  "https://res.cloudinary.com/piyushgoenka/image/upload/c_fill,w_800,h_600,g_center,q_82,f_auto/v1782292587/products/guitars/hertz-hza4503-hza4503/01-hza-4503-na-amazonfront.png";

/** Second-card (and variant) images for header mega menus — keyed by `slug:variant`. */
const MEGA_MENU_VARIANT_OVERRIDES: Record<string, string> = {
  "guitars:acoustic": GUITAR_MEGA_ACOUSTIC_IMAGE,
  "guitars:electric": GUITAR_MEGA_ELECTRIC_IMAGE,
  "studio-recording:monitors":
    "/images/m/promotions/2025/1202_CyberWeek/Homepage-Takeover/Adjacency4Up/1202-CyberWeek-Adjacency-Headphones-HPFeatured-1600x1600.jpg",
  "drums-percussion:electronic":
    "/images/m/promotions/2026/0603-Drum-Month/homepage/superhero/0603-DrumMonth-Superhero-Images-3.jpg",
  "keyboards-synthesizers:synthesizer":
    "https://res.cloudinary.com/piyushgoenka/image/upload/c_fill,w_800,h_600,g_auto,q_82,f_auto/v1782291074/products/keyboards-synthesizers/adeon-adeon-ax-kb-41xl-adeon-ax-kb-41xl/01-adeon-41-kb-l.png",
  "live-sound-lighting:lighting":
    "https://res.cloudinary.com/piyushgoenka/image/upload/a_45,c_fit,w_800,h_600,g_center,q_82,f_auto/v1782289280/products/live-sound-lighting/adeon-acon-acon/01-artboard-3.png",
  "software-plug-ins:plugin":
    "/images/m/products/image/ce349f6ddbpWnBa7UdRlNlAUJ0fhyGkXuQUKCv6V.png",
  "dj-equipment:turntable":
    "/images/m/products/image/052250cf73nOL3KRtEQEEmF9AByd84tPzCw64Ycd.jpg",
  "cables-cases-accessories:cables":
    "/images/m/products/image/6a29cdc6e653NWv2mMN2IAdpJxfo9MiePtgYNx2u.jpg",
  "cables-cases-accessories:cases":
    "/images/m/products/image/2f51071997sqxE3R3gW9W0nTbFJsJVxfRgVdqWBU.jpg",
};

function withHeroParams(path: string): string {
  if (path.startsWith("http")) return path;
  const basePath = path.split("?")[0];
  return `${basePath}?${HERO_IMAGE_PARAMS}`;
}

function hrefForCategorySlug(slug: string): string {
  const normalized = slug.toLowerCase();
  return SLUG_TO_HREF[normalized] ?? categoryPath(normalized);
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
export const MARKETING_EDITORIAL_IMAGE = "/images/New Guitar.png";

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
    withHeroParams(FALLBACK_IMAGE)
  );
}

/** Mega menu featured cards — supports per-category variants (e.g. electric vs acoustic). */
export function getMegaMenuFeaturedImage(slug: string, variant?: string): string {
  if (variant) {
    const override = MEGA_MENU_VARIANT_OVERRIDES[`${slug}:${variant}`];
    if (override) return withHeroParams(override);
  }

  return getCategoryHeroImage(slug);
}
