/** Rotating hero visuals — curated top catalog products available on the site. */

import { productPath } from "@/lib/routes";

export interface MarketingHeroSlide {
  src: string;
  alt: string;
  href: string;
  /** Default `contain` keeps product shots fully visible; use `cover` for banner art. */
  fit?: "contain" | "cover";
  objectPosition?: string;
}

/** Selected top / new-arrival products from the live catalog (CDN). */
export const MARKETING_HERO_SLIDES: MarketingHeroSlide[] = [
  {
    src: "https://cdn.vibemusic.in/products/guitars/hertz-hza-3900-hza-3900/bda6138f-71bc-4c26-aa76-b84be96c9c74.png",
    alt: "HERTZ HZA-3900 acoustic guitar in tobacco sunburst",
    href: productPath("hertz-hza-3900-hza-3900"),
    fit: "contain",
    objectPosition: "center bottom",
  },
  {
    src: "https://cdn.vibemusic.in/products/live-sound-lighting/adeon-ams84f-ams84f/e5cbfc73-4ff2-4822-a93c-320d6607cd06.png",
    alt: "ADEON AMS84F professional audio mixer console",
    href: productPath("adeon-ams84f-ams84f"),
    fit: "contain",
    objectPosition: "center center",
  },
  {
    src: "https://cdn.vibemusic.in/products/drums-percussion/avus-avus-hathor-16-avus-hathor-16/7cc17c11-e64d-4aed-b820-682165bb8d26.png",
    alt: "AVUS HATHOR 16 inch professional cymbal",
    href: productPath("avus-avus-hathor-16-avus-hathor-16"),
    fit: "contain",
    objectPosition: "center center",
  },
  {
    src: "https://cdn.vibemusic.in/products/microphones-wireless/adeon-adeon-aedan-pro1-adeon-aedan-pro1/e46688bd-9712-4eac-b0e1-2f9d9384cbae.png",
    alt: "ADEON AEDAN PRO1 professional microphone",
    href: productPath("adeon-adeon-aedan-pro1-adeon-aedan-pro1"),
    fit: "contain",
    objectPosition: "center bottom",
  },
  {
    src: "https://cdn.vibemusic.in/products/live-sound-lighting/adeon-ad15dsp-ad15dsp/515381f7-f845-46c3-abef-a78cad31d6a7.png",
    alt: "ADEON AD15DSP professional active PA speaker",
    href: productPath("adeon-ad15dsp-ad15dsp"),
    fit: "contain",
    objectPosition: "center center",
  },
  {
    src: "https://cdn.vibemusic.in/products/home-audio-electronics/adeon-adeon-hdm-50-hdm-50/82b29098-de08-4906-abeb-471d4ea81120.png",
    alt: "ADEON HDM-50 professional headphones",
    href: productPath("adeon-adeon-hdm-50-hdm-50"),
    fit: "contain",
    objectPosition: "center center",
  },
  {
    src: "https://cdn.vibemusic.in/products/guitars/hertz-hza-3600-hza-3600/32de32ce-98b0-423c-8f2e-48659dc622ba.png",
    alt: "HERTZ HZA-3600 natural finish acoustic guitar",
    href: productPath("hertz-hza-3600-hza-3600"),
    fit: "contain",
    objectPosition: "center bottom",
  },
  {
    src: "https://cdn.vibemusic.in/products/live-sound-lighting/adeon-acm18-acm18/bd28f237-9020-4c54-828b-13ec89f0aca5.png",
    alt: "ADEON ACM18 professional audio mixer console",
    href: productPath("adeon-acm18-acm18"),
    fit: "contain",
    objectPosition: "center center",
  },
];

export const MARKETING_HERO_FALLBACK =
  "https://cdn.vibemusic.in/products/guitars/hertz-hza-3900-hza-3900/bda6138f-71bc-4c26-aa76-b84be96c9c74.png";

export const MARKETING_HERO_ROTATE_MS = 3500;
