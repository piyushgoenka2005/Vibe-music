import { categoryPath, ROUTES } from "@/lib/routes";

export interface BrowseCategoryCard {
  id: string;
  title: string;
  href: string;
  image: string;
  srcSet: string;
  width: number;
  height: number;
}

/** Category listing when a catalog slug exists. */
function browseCategory(slug: string): string {
  return categoryPath(slug);
}

/**
 * Scoped search for subcategory-style tiles (e.g. acoustic guitars inside
 * `guitars`). Prefer `category` + `subcategory` so results stay exact.
 */
function browseSearch(options: {
  category?: string;
  subcategory?: string;
  q?: string;
}): string {
  const params = new URLSearchParams();
  if (options.category) params.set("category", options.category);
  if (options.subcategory) params.set("subcategory", options.subcategory);
  if (options.q) params.set("q", options.q);
  return `${ROUTES.searchResults}?${params.toString()}`;
}

function localImage(
  src: string,
  width: number,
  height: number
): Pick<BrowseCategoryCard, "image" | "srcSet" | "width" | "height"> {
  return {
    image: src,
    srcSet: `${src} 800w`,
    width,
    height,
  };
}

/**
 * Browse tiles mapped to real Vibe Music catalog routes — local assets only.
 */
export const BROWSE_CATEGORY_CARDS: BrowseCategoryCard[] = [
  {
    id: "guitars",
    title: "Guitars",
    href: browseCategory("guitars"),
    ...localImage("/images/Electric Orange Guitar.png", 1200, 801),
  },
  {
    id: "acoustic-guitars",
    title: "Acoustic Guitars",
    href: browseSearch({ category: "guitars", subcategory: "Acoustic" }),
    ...localImage("/images/guitar.png", 1080, 719),
  },
  {
    id: "amplifiers",
    title: "Amplifiers",
    href: browseSearch({ category: "guitars", subcategory: "AMPLIFIER" }),
    ...localImage("/images/Hertz.webp", 1512, 1080),
  },
  {
    id: "drums-percussion",
    title: "Drums & Percussion",
    href: browseCategory("drums-percussion"),
    ...localImage("/images/m/home/cats/thumbs/LM402.webp", 1280, 1600),
  },
  {
    id: "live-sound-lighting",
    title: "Live Sound",
    href: browseCategory("live-sound-lighting"),
    ...localImage("/images/m/home/cats/thumbs/k12_2.webp", 2800, 2013),
  },
  {
    id: "microphones-wireless",
    title: "Microphones",
    href: browseCategory("microphones-wireless"),
    ...localImage("/images/m/home/cats/thumbs/SM58-cat.webp", 1280, 1600),
  },
  {
    id: "home-audio-electronics",
    title: "Home Audio",
    href: browseCategory("home-audio-electronics"),
    ...localImage("/images/m/home/cats/thumbs/M4WP006.webp", 1080, 1080),
  },
  {
    id: "used",
    title: "Used & Open-Box",
    href: ROUTES.used,
    ...localImage("/images/guitar-2.webp", 1600, 1280),
  },
];

export const BROWSE_CATEGORY_CARDS_CTA = ROUTES.categories;
