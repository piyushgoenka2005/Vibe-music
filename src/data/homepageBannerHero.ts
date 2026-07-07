import { ROUTES, categoryPath } from "@/lib/routes";

export interface HomepageBannerSlide {
  id: string;
  src: string;
  alt: string;
  href: string;
  /** Default `cover`; use `contain` to show the full artwork without cropping. */
  fit?: "contain" | "cover";
  /** Viewport aspect ratio while this slide is active, e.g. `"2 / 1"`. */
  aspectRatio?: string;
  objectPosition?: string;
}

export const HOMEPAGE_BANNER_ROTATION_MS = 3500;

/** Client-approved homepage hero banner carousel slides. */
export const HOMEPAGE_BANNER_SLIDES: HomepageBannerSlide[] = [
  {
    id: "banner-sale-july",
    src: "/images/upto-60-off.png",
    alt: "Up to 60% off — sale starts July 8th at Vibe Music",
    href: ROUTES.deals,
  },
  {
    id: "banner-play-everyday",
    src: "/images/Play Music Everyday.png",
    alt: "Play Music Everyday — bringing happiness through the language of music at Vibe Music",
    href: ROUTES.search,
  },
  {
    id: "banner-grand-piano-9",
    src: "/images/grand-piano-9.png",
    alt: "Grand Piano-9 — fun and easy piano with hybrid mechanism for all ages at Vibe Music",
    href: ROUTES.gp9,
  },
  {
    id: "banner-hertz",
    src: "/images/Hertz.png",
    alt: "Hertz amplifiers — turn up the power and feel every beat at Vibe Music",
    href: `${ROUTES.searchResults}?brand=hertz`,
  },
  {
    id: "banner-4",
    src: "/images/banner-4.png",
    alt: "Find Your Perfect Sound — premium acoustic guitars at Vibe Music",
    href: categoryPath("guitars"),
  },
];
