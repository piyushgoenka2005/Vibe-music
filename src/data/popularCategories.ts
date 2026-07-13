import { categoryPath } from "@/lib/routes";

export interface PopularCategoryItem {
  slot: number;
  href: string;
  title: string;
  imageSrc: string;
  imageSrcSet: string;
  badge?: "New";
}

/** First eight cards shown in the homepage Popular Categories strip. */
export const HOMEPAGE_POPULAR_CATEGORY_COUNT = 8;

const SIZES = "(max-width:768px) 101px, (max-width:1000px) 10vw, 101px";
const THUMB = "/images/m/home/cats/thumbs";

/** Pre-generated 200px WebP thumbs (static hosting ignores ?width= query params). */
function thumb(name: string): string {
  return `${THUMB}/${name}.webp`;
}

function thumbSrcSet(name: string): string {
  const src = thumb(name);
  return `${src} 200w`;
}

export const POPULAR_CATEGORY_ITEMS: PopularCategoryItem[] = [
  {
    slot: 0,
    href: categoryPath("guitars"),
    title: "Guitars",
    imageSrc: thumb("LPR59VOWCSNH"),
    imageSrcSet: thumbSrcSet("LPR59VOWCSNH"),
  },
  {
    slot: 1,
    href: categoryPath("studio-recording"),
    title: "Studio & Recording",
    imageSrc: thumb("Arrow-small"),
    imageSrcSet: thumbSrcSet("Arrow-small"),
  },
  {
    slot: 2,
    href: categoryPath("drums-percussion"),
    title: "Drums & Percussion",
    imageSrc: thumb("LM402"),
    imageSrcSet: thumbSrcSet("LM402"),
  },
  {
    slot: 3,
    href: categoryPath("bass"),
    title: "Bass",
    imageSrc: thumb("PBassAPR3SB"),
    imageSrcSet: thumbSrcSet("PBassAPR3SB"),
  },
  {
    slot: 4,
    href: categoryPath("keyboards-synthesizers"),
    title: "Keyboards & Synthesizers",
    imageSrc: thumb("Matriarch"),
    imageSrcSet: thumbSrcSet("Matriarch"),
  },
  {
    slot: 5,
    href: categoryPath("live-sound-lighting"),
    title: "Live Sound & Lighting",
    imageSrc: thumb("k12_2"),
    imageSrcSet: thumbSrcSet("k12_2"),
  },
  {
    slot: 6,
    href: categoryPath("software-plug-ins"),
    title: "Software & Plug-ins",
    imageSrc: thumb("ptstudioann"),
    imageSrcSet: thumbSrcSet("ptstudioann"),
  },
  {
    slot: 7,
    href: categoryPath("dj-equipment"),
    title: "DJ Equipment",
    imageSrc: thumb("ATLP120XUSBSV"),
    imageSrcSet: thumbSrcSet("ATLP120XUSBSV"),
  },
  {
    slot: 8,
    href: categoryPath("microphones-wireless"),
    title: "Microphones & Wireless",
    imageSrc: thumb("SM58-cat"),
    imageSrcSet: thumbSrcSet("SM58-cat"),
  },
  {
    slot: 9,
    href: categoryPath("band-orchestra"),
    title: "Band & Orchestra",
    imageSrc: thumb("KingSlvFlTr"),
    imageSrcSet: thumbSrcSet("KingSlvFlTr"),
    badge: "New",
  },
  {
    slot: 10,
    href: categoryPath("home-audio-electronics"),
    title: "Home Audio & Electronics",
    imageSrc: thumb("TourOneM2Bk"),
    imageSrcSet: thumbSrcSet("TourOneM2Bk"),
    badge: "New",
  },
  {
    slot: 11,
    href: categoryPath("commercial-audio-installation"),
    title: "Commercial Audio & Install",
    imageSrc: thumb("Control28"),
    imageSrcSet: thumbSrcSet("Control28"),
  },
  {
    slot: 12,
    href: categoryPath("cables-cases-accessories"),
    title: "Cables, Cases, Stands & More",
    imageSrc: thumb("M4WP006"),
    imageSrcSet: thumbSrcSet("M4WP006"),
  },
  {
    slot: 13,
    href: categoryPath("video-cameras"),
    title: "Video & Cameras",
    imageSrc: thumb("EOSR82450Kit"),
    imageSrcSet: thumbSrcSet("EOSR82450Kit"),
    badge: "New",
  },
];

export const POPULAR_CATEGORY_IMAGE_SIZES = SIZES;

/** Static strip used when CMS/catalog featured categories are unavailable. */
export function getHomepagePopularCategoryItems(
  limit = HOMEPAGE_POPULAR_CATEGORY_COUNT
): Array<{
  id: string;
  slug: string;
  title: string;
  href: string;
  imageSrc: string;
  badge?: string;
}> {
  return POPULAR_CATEGORY_ITEMS.slice(0, limit).map((item) => {
    const slug =
      item.href.split("/").filter(Boolean).pop() ?? `category-${item.slot}`;
    return {
      id: `popular-cat-${item.slot}`,
      slug,
      title: item.title,
      href: item.href,
      imageSrc: item.imageSrc,
      badge: item.badge,
    };
  });
}
