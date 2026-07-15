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

export const HOMEPAGE_BANNER_ROTATION_MS = 4000;

/** Client-approved homepage hero banner carousel slides.
 *  Index 0 is always the first frame on load (priority + eager).
 */
export const HOMEPAGE_BANNER_SLIDES: HomepageBannerSlide[] = [
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
