import { ROUTES, categoryPath } from "@/lib/routes";

export interface HomepageBannerSlide {
  id: string;
  src: string;
  /** Optional mobile-specific artwork; falls back to `src`. */
  mobileSrc?: string;
  alt: string;
  href: string;
  title?: string;
  subtitle?: string;
  ctaText?: string;
  /** Bust client cache when admin updates a banner. */
  updatedAt?: string;
  /** Default `cover`; use `contain` to show the full artwork without cropping. */
  fit?: "contain" | "cover";
  /** Viewport aspect ratio while this slide is active, e.g. `"2 / 1"`. */
  aspectRatio?: string;
  objectPosition?: string;
}

export const HOMEPAGE_BANNER_ROTATION_MS = 4000;

const INDEPENDENCE_DAY_BANNER_SRC = "/independence-day-special.png";

/** Client-approved homepage hero banner carousel slides.
 *  Index 0 is always the first frame on load (priority + eager).
 */
export const HOMEPAGE_BANNER_SLIDES: HomepageBannerSlide[] = [
  {
    id: "banner-independence-day-2026",
    src: INDEPENDENCE_DAY_BANNER_SRC,
    alt: "Strings of Freedom — Celebrate Independence Day with music at Vibe Music",
    href: ROUTES.deals,
    title: "Strings of Freedom",
    subtitle: "Celebrate Independence with Music",
    ctaText: "Shop the sale",
    objectPosition: "center center",
  },
  {
    id: "banner-hertz-hg-20",
    src: "/hertz-hg-20.webp",
    alt: "Hertz HG 20 portable guitar amplifier — delay & reverb, 20W powerful sound at Vibe Music",
    href: `${ROUTES.searchResults}?brand=hertz`,
    objectPosition: "center center",
  },
  {
    id: "banner-hertz-electrix-guitar",
    src: "/electrix-guitar.webp",
    alt: "Hertz Super Strat electric guitar — Indian rosewood fretboard, 21 precision frets, PJ pickups at Vibe Music",
    href: categoryPath("guitars"),
    objectPosition: "center center",
  },
  {
    id: "banner-zoom-ms-200d",
    src: "/images/banner-5.jpeg",
    alt: "Zoom MS-200D+ MultiStomp — Feel Every Beat multi effects processor at Vibe Music",
    href: `${ROUTES.searchResults}?brand=zoom`,
    objectPosition: "center center",
  },
  {
    id: "banner-zoom-ms-90lp",
    src: "/images/banner-6.jpeg",
    alt: "Zoom MultiStomp MS-90LP+ Looper Pedal — Create. Loop. Perform. at Vibe Music",
    href: `${ROUTES.searchResults}?brand=zoom`,
    objectPosition: "center center",
  },
  {
    id: "banner-independence-day-music-fly",
    src: "/images/banner-7.png",
    alt: "This Independence Day let your music fly — Hertz HG-10 guitar amplifier at Vibe Music",
    href: `${ROUTES.searchResults}?brand=hertz`,
    objectPosition: "center center",
  },
  {
    id: "banner-independence-day-80th",
    src: "/images/banner-8.png",
    alt: "Happy 80th Independence Day — Hertz HG-10 guitar amplifier at Vibe Music",
    href: `${ROUTES.searchResults}?brand=hertz`,
    objectPosition: "center center",
  },
  {
    id: "banner-endless-sound",
    src: "/images/3.3.webp",
    alt: "Endless Sound — premium electric guitars at Vibe Music",
    href: categoryPath("guitars"),
    objectPosition: "center center",
  },
  {
    id: "banner-hertz",
    src: "/images/Hertz.webp",
    alt: "Hertz amplifiers — turn up the power and feel every beat at Vibe Music",
    href: `${ROUTES.searchResults}?brand=hertz`,
    objectPosition: "center center",
  },
];
