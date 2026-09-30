import { getCategoryHeroImage } from "@/lib/categoryImages";
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
function browseSearch(options: { category?: string; subcategory?: string; q?: string }): string {
  const params = new URLSearchParams();
  if (options.category) params.set("category", options.category);
  if (options.subcategory) params.set("subcategory", options.subcategory);
  if (options.q) params.set("q", options.q);
  return `${ROUTES.searchResults}?${params.toString()}`;
}

function heroImage(
  slug: string,
  width: number,
  height: number,
): Pick<BrowseCategoryCard, "image" | "srcSet" | "width" | "height"> {
  const image = getCategoryHeroImage(slug);
  return {
    image,
    srcSet: `${image} ${width}w`,
    width,
    height,
  };
}

/**
 * Browse tiles — reuse curated category hero art from public/images.
 */
export const BROWSE_CATEGORY_CARDS: BrowseCategoryCard[] = [
  {
    id: "guitars",
    title: "Guitars",
    href: browseCategory("guitars"),
    ...heroImage("guitars", 800, 534),
  },
  {
    id: "acoustic-guitars",
    title: "Acoustic Guitars",
    href: browseSearch({ category: "guitars", subcategory: "Acoustic" }),
    ...heroImage("guitars", 800, 533),
  },
  {
    id: "amplifiers",
    title: "Amplifiers",
    href: browseSearch({ category: "guitars", subcategory: "AMPLIFIER" }),
    ...heroImage("guitars", 800, 571),
  },
  {
    id: "drums-percussion",
    title: "Drums & Percussion",
    href: browseCategory("drums-percussion"),
    ...heroImage("drums-percussion", 800, 1000),
  },
  {
    id: "live-sound-lighting",
    title: "Live Sound",
    href: browseCategory("live-sound-lighting"),
    ...heroImage("live-sound-lighting", 800, 575),
  },
  {
    id: "microphones-wireless",
    title: "Microphones",
    href: browseCategory("microphones-wireless"),
    ...heroImage("microphones-wireless", 800, 1000),
  },
  {
    id: "home-audio-electronics",
    title: "Home Audio",
    href: browseCategory("home-audio-electronics"),
    ...heroImage("home-audio-electronics", 800, 800),
  },
  {
    id: "used",
    title: "Used & Open-Box",
    href: ROUTES.used,
    ...heroImage("guitars", 800, 640),
  },
];

export const BROWSE_CATEGORY_CARDS_CTA = ROUTES.categories;
