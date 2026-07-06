/** Rotating hero visuals for the split marketing hero. */

import { categoryPath, ROUTES } from "@/lib/routes";

export interface MarketingHeroSlide {
  src: string;
  alt: string;
  href: string;
  /** Default `contain` keeps product shots fully visible; use `cover` for banner art. */
  fit?: "contain" | "cover";
  objectPosition?: string;
}

const PRODUCT = "/images/m/products/image";
const CAT = "/images/m/home/cats";

export const MARKETING_HERO_SLIDES: MarketingHeroSlide[] = [
  {
    src: "/images/Tl 6 BUTTER BLONDIE1.png",
    alt: "Hertz TL-6 electric guitar in butter blond finish",
    href: categoryPath("guitars"),
    fit: "contain",
    objectPosition: "center center",
  },
  {
    src: "/images/Tl 6 MNT GREEN Colored New_.png",
    alt: "Hertz TL-6 electric guitar in mint green",
    href: categoryPath("guitars"),
    fit: "contain",
    objectPosition: "center center",
  },
  {
    src: "/images/New Guitar.png",
    alt: "Fender Stratocaster electric guitar in sunburst",
    href: `${ROUTES.searchResults}?brand=fender`,
    fit: "contain",
    objectPosition: "center bottom",
  },
  {
    src: `${PRODUCT}/ce349f6ddbpWnBa7UdRlNlAUJ0fhyGkXuQUKCv6V.png`,
    alt: "Akai MPC sampler and keyboard",
    href: categoryPath("studio-recording"),
    fit: "contain",
    objectPosition: "center bottom",
  },
  {
    src: `${PRODUCT}/2cdf4bf761DZWztWMTXvRjefZynBO9RTcVrcDe0F.jpg`,
    alt: "Universal Audio Apollo studio interface",
    href: categoryPath("studio-recording"),
    fit: "contain",
    objectPosition: "center center",
  },
  {
    src: `${CAT}/PBassAPR3SB.png`,
    alt: "Fender Precision bass guitar",
    href: categoryPath("bass"),
    fit: "contain",
    objectPosition: "center bottom",
  },
  {
    src: `${PRODUCT}/6c9d9ecdf8KxbYZ66Y2FbzDnGWRM90iaN4Xlc84X.jpg`,
    alt: "QSC live sound PA speaker",
    href: categoryPath("live-sound-lighting"),
    fit: "contain",
    objectPosition: "center 35%",
  },
  {
    src: "/images/Tl 6 MNT GREEN Colored New_.png",
    alt: "PRS electric guitar in seafoam green",
    href: `${ROUTES.searchResults}?brand=prs`,
    fit: "contain",
    objectPosition: "center bottom",
  },
  {
    src: `${CAT}/LM402.png`,
    alt: "Roland electronic drum module",
    href: categoryPath("drums-percussion"),
    fit: "contain",
    objectPosition: "center bottom",
  },
];

export const MARKETING_HERO_FALLBACK = "/images/Electric Blue Guitar.png";

export const MARKETING_HERO_ROTATE_MS = 3500;
