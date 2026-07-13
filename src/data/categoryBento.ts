import { POPULAR_CATEGORY_ITEMS } from "@/data/popularCategories";
import { categoryPath } from "@/lib/routes";

export type CategoryBentoSize = "large" | "small";
export type CategoryBentoVariant = "hero-light" | "image-card";
export type CategoryBentoBadge = "NEW" | "TRENDING" | "BESTSELLER";

export interface CategoryBentoItem {
  slug: string;
  title: string;
  desc: string;
  size: CategoryBentoSize;
  variant: CategoryBentoVariant;
  image: string;
  imageSrcSet?: string;
  imageSizes?: string;
  imageAlt: string;
  imagePosition: string;
  wide?: boolean;
  productCount?: string;
  brands?: string;
  badge?: CategoryBentoBadge;
}

const CAT = "/images/m/home/cats";

/** Map bento slugs to popular-category hrefs for image lookup. */
const SLUG_TO_HREF: Record<string, string> = {
  guitars: categoryPath("guitars"),
  "studio-recording": categoryPath("studio-recording"),
  "drums-percussion": categoryPath("drums-percussion"),
  "keyboards-synthesizers": categoryPath("keyboards-synthesizers"),
  "live-sound-lighting": categoryPath("live-sound-lighting"),
  "software-plug-ins": categoryPath("software-plug-ins"),
  "dj-equipment": categoryPath("dj-equipment"),
  "cables-cases-accessories": categoryPath("cables-cases-accessories"),
};

const BENTO_IMAGE_FILES: Record<string, string> = {
  guitars: "/images/Electric Orange Guitar.png",
  "studio-recording": `${CAT}/Arrow-small.png`,
  "drums-percussion": `${CAT}/LM402.png`,
  "keyboards-synthesizers": `${CAT}/Matriarch.png`,
  "live-sound-lighting": `${CAT}/k12_2.png`,
  "software-plug-ins": `${CAT}/ptstudioann.jpg`,
  "dj-equipment": `${CAT}/ATLP120XUSBSV.png`,
  "cables-cases-accessories": `${CAT}/M4WP006.png`,
};

/** Build optimized image URL for bento tile sizes. */
export function resolveBentoImage(slug: string): string {
  const base =
    BENTO_IMAGE_FILES[slug] ??
    POPULAR_CATEGORY_ITEMS.find((item) => item.href === SLUG_TO_HREF[slug])
      ?.imageSrc.split("?")[0] ??
    `${CAT}/LPR59VOWCSNH.png`;

  return base;
}

function resolveBentoSrcSet(slug: string, size: "hero" | "card" = "card"): string | undefined {
  const base =
    BENTO_IMAGE_FILES[slug] ??
    POPULAR_CATEGORY_ITEMS.find((item) => item.href === SLUG_TO_HREF[slug])
      ?.imageSrc.split("?")[0] ??
    `${CAT}/LPR59VOWCSNH.png`;

  const widths = size === "hero" ? [800, 1200, 1600] : [480, 768, 1200];
  return widths.map((width) => `${base} ${width}w`).join(", ");
}

function resolveBentoSizes(size: "hero" | "card" = "card"): string {
  if (size === "hero") {
    return "(min-width: 1024px) 50vw, (min-width: 768px) 66vw, 92vw";
  }
  return "(min-width: 1280px) 25vw, (min-width: 768px) 50vw, 86vw";
}

export const CATEGORY_BENTO_ITEMS: CategoryBentoItem[] = [
  {
    slug: "guitars",
    title: "Guitars",
    desc: "Acoustic • Electric • Bass",
    size: "small",
    variant: "image-card",
    image: resolveBentoImage("guitars"),
    imageSrcSet: resolveBentoSrcSet("guitars"),
    imageSizes: resolveBentoSizes(),
    imageAlt: "Premium electric guitar with sunburst finish",
    imagePosition: "center 72%",
    productCount: "2,500+ Products",
    brands: "Fender • Gibson • Ibanez",
    badge: "BESTSELLER",
  },
  {
    slug: "studio-recording",
    title: "Studio",
    desc: "Interfaces • Monitors • Mics",
    size: "small",
    variant: "image-card",
    image: resolveBentoImage("studio-recording"),
    imageSrcSet: resolveBentoSrcSet("studio-recording"),
    imageSizes: resolveBentoSizes(),
    imageAlt: "Studio recording interface and monitors",
    imagePosition: "center 38%",
    productCount: "1,200+ Products",
    brands: "Universal Audio • Focusrite • Neumann",
    badge: "TRENDING",
  },
  {
    slug: "drums-percussion",
    title: "Drums",
    desc: "Kits • Cymbals • Percussion",
    size: "small",
    variant: "image-card",
    image: resolveBentoImage("drums-percussion"),
    imageSrcSet: resolveBentoSrcSet("drums-percussion"),
    imageSizes: resolveBentoSizes(),
    imageAlt: "Premium drum kit",
    imagePosition: "center center",
    productCount: "850+ Products",
    brands: "Pearl • Zildjian • Roland",
  },
  {
    slug: "keyboards-synthesizers",
    title: "Keys",
    desc: "Synths • Pianos • Controllers",
    size: "small",
    variant: "image-card",
    image: resolveBentoImage("keyboards-synthesizers"),
    imageSrcSet: resolveBentoSrcSet("keyboards-synthesizers"),
    imageSizes: resolveBentoSizes(),
    imageAlt: "Synthesizer keyboard",
    imagePosition: "center 32%",
    productCount: "960+ Products",
    brands: "Moog • Roland • Nord",
    badge: "NEW",
  },
  {
    slug: "live-sound-lighting",
    title: "Live Sound",
    desc: "PA • Mixers • Lighting",
    size: "small",
    variant: "image-card",
    image: resolveBentoImage("live-sound-lighting"),
    imageSrcSet: resolveBentoSrcSet("live-sound-lighting"),
    imageSizes: resolveBentoSizes(),
    imageAlt: "Live sound PA speaker",
    imagePosition: "center 28%",
    productCount: "720+ Products",
    brands: "QSC • Yamaha • Chauvet",
  },
  {
    slug: "software-plug-ins",
    title: "Software",
    desc: "DAWs • Plug-ins • Production",
    size: "small",
    variant: "image-card",
    image: resolveBentoImage("software-plug-ins"),
    imageSrcSet: resolveBentoSrcSet("software-plug-ins"),
    imageSizes: resolveBentoSizes(),
    imageAlt: "DAW and plug-in software",
    imagePosition: "center 42%",
    productCount: "540+ Products",
    brands: "Ableton • Native Instruments • iZotope",
    badge: "TRENDING",
  },
  {
    slug: "dj-equipment",
    title: "DJ",
    desc: "Controllers • Decks • Mixers",
    size: "small",
    variant: "image-card",
    image: resolveBentoImage("dj-equipment"),
    imageSrcSet: resolveBentoSrcSet("dj-equipment"),
    imageSizes: resolveBentoSizes(),
    imageAlt: "DJ turntable and controller gear",
    imagePosition: "center 40%",
    productCount: "380+ Products",
    brands: "Pioneer DJ • Denon • Rane",
  },
  {
    slug: "cables-cases-accessories",
    title: "Accessories",
    desc: "Cables • Cases • Stands",
    size: "small",
    variant: "image-card",
    image: resolveBentoImage("cables-cases-accessories"),
    imageSrcSet: resolveBentoSrcSet("cables-cases-accessories"),
    imageSizes: resolveBentoSizes(),
    imageAlt: "Cables, cases, and stands for musicians",
    imagePosition: "center 45%",
    productCount: "1,100+ Products",
    brands: "Hosa • Gator • On-Stage",
  },
];

export function getCategoryBentoItem(slug: string): CategoryBentoItem | undefined {
  return CATEGORY_BENTO_ITEMS.find((item) => item.slug === slug);
}
