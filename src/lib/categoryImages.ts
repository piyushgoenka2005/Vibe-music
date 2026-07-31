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

/** Canonical department slug used for curated art lookups. */
const SLUG_ALIASES: Record<string, string> = {
  "software-plugins": "software-plug-ins",
  "live-sound": "live-sound-lighting",
};

function canonicalizeCategorySlug(slug: string): string {
  const normalized = slug.trim().toLowerCase();
  return SLUG_ALIASES[normalized] ?? normalized;
}

const FALLBACK_IMAGE = "/images/m/home/cats/LPR59VOWCSNH.png";
const THUMB_DIR = "/images/m/home/cats/thumbs";

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

function cleanLocalPath(path: string): string {
  if (path.startsWith("http")) return path;
  return path.split("?")[0];
}

function hrefForCategorySlug(slug: string): string {
  const normalized = canonicalizeCategorySlug(slug);
  return SLUG_TO_HREF[normalized] ?? categoryPath(normalized);
}

function imageFromPopularCategories(href: string): string | undefined {
  const item = POPULAR_CATEGORY_ITEMS.find((category) => category.href === href);
  if (!item?.imageSrc) return undefined;
  return cleanLocalPath(item.imageSrc);
}

/** Fallback hero when no CMS banners are configured. */
export const MARKETING_HERO_IMAGE =
  "/images/m/products/image/d55a7ca800bRKFzzzI1LkoPdgD1ymbxu18tLjQgI.png";

/** Editorial split section image. */
export const MARKETING_EDITORIAL_IMAGE = "/images/New Guitar.png";

/** Full-resolution category art for mega menus / larger placements. */
const HERO_IMAGE_BY_SLUG: Record<string, string> = {
  guitars: "/images/m/home/cats/LPR59VOWCSNH.png",
  "studio-recording": "/images/m/home/cats/Arrow-small.png",
  "drums-percussion": "/images/m/home/cats/LM402.png",
  bass: "/images/m/home/cats/PBassAPR3SB.png",
  "keyboards-synthesizers": "/images/m/home/cats/Matriarch.png",
  "live-sound-lighting": "/images/m/home/cats/k12_2.png",
  "software-plug-ins": "/images/m/home/cats/ptstudioann.jpg",
  "dj-equipment": "/images/m/home/cats/ATLP120XUSBSV.png",
  "microphones-wireless": "/images/m/home/cats/SM58-cat.png",
  "band-orchestra": "/images/m/home/cats/KingSlvFlTr.png",
  "home-audio-electronics": "/images/m/home/cats/TourOneM2Bk.png",
  "commercial-audio-installation": "/images/m/home/cats/Control28.png",
  "cables-cases-accessories": "/images/m/home/cats/M4WP006.png",
  "video-cameras": "/images/m/home/cats/EOSR82450Kit.png",
};

/** Explicit grid thumbs — never fall back to the Guitars Les Paul for these. */
const GRID_THUMB_BY_SLUG: Record<string, string> = {
  guitars: `${THUMB_DIR}/LPR59VOWCSNH.webp`,
  bass: `${THUMB_DIR}/PBassAPR3SB.webp`,
  "studio-recording": `${THUMB_DIR}/Arrow-small.webp`,
  "drums-percussion": `${THUMB_DIR}/LM402.webp`,
  "keyboards-synthesizers": `${THUMB_DIR}/Matriarch.webp`,
  "live-sound-lighting": `${THUMB_DIR}/k12_2.webp`,
  "software-plug-ins": `${THUMB_DIR}/ptstudioann.webp`,
  "dj-equipment": `${THUMB_DIR}/ATLP120XUSBSV.webp`,
  "microphones-wireless": `${THUMB_DIR}/SM58-cat.webp`,
  "band-orchestra": `${THUMB_DIR}/KingSlvFlTr.webp`,
  "home-audio-electronics": `${THUMB_DIR}/TourOneM2Bk.webp`,
  "commercial-audio-installation": `${THUMB_DIR}/Control28.webp`,
  "cables-cases-accessories": `${THUMB_DIR}/M4WP006.webp`,
  "video-cameras": `${THUMB_DIR}/EOSR82450Kit.webp`,
};

/** True when we ship dedicated local art for this department slug. */
export function hasCuratedCategoryImage(slug: string): boolean {
  const key = canonicalizeCategorySlug(slug);
  return Boolean(HERO_IMAGE_BY_SLUG[key] || GRID_THUMB_BY_SLUG[key]);
}

/** Grid / carousel category thumbnail (popular categories strip + /categories). */
export function getCategoryGridImage(slug: string): string {
  const key = canonicalizeCategorySlug(slug);
  if (GRID_THUMB_BY_SLUG[key]) return GRID_THUMB_BY_SLUG[key];

  const href = hrefForCategorySlug(key);
  return imageFromPopularCategories(href) ?? FALLBACK_IMAGE;
}

/** Hero-sized category image for bento tiles and marketing blocks. */
export function getCategoryHeroImage(slug: string): string {
  const key = canonicalizeCategorySlug(slug);
  return HERO_IMAGE_BY_SLUG[key] ?? FALLBACK_IMAGE;
}

/** Mega menu featured cards — supports per-category variants (e.g. electric vs acoustic). */
export function getMegaMenuFeaturedImage(slug: string, variant?: string): string {
  const key = canonicalizeCategorySlug(slug);
  if (variant) {
    const override = MEGA_MENU_VARIANT_OVERRIDES[`${key}:${variant}`];
    if (override) return cleanLocalPath(override);
  }

  return getCategoryHeroImage(key);
}
