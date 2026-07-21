import { productPath } from "@/lib/routes";
import type { HomepageTopProduct } from "@/data/homepageTopProducts";

/** Curated fallbacks when live trending catalog data is unavailable. */
export const HOMEPAGE_TRENDING_FALLBACK_PRODUCTS: HomepageTopProduct[] = [
  {
    id: "trending-cymbals",
    title: "AVUS GENEXT Professional Percussion Cymbal Set",
    excerpt:
      "Complete bronze cymbal set for stage and studio — balanced wash, crash, and ride tones.",
    tags: ["Drums", "Trending"],
    href: productPath("avus-genext-genext"),
    image:
      "https://cdn.vibemusic.in/products/drums-percussion/avus-genext-genext/e5cbfc73-4ff2-4822-a93c-320d6607cd06.png",
    brandLabel: "AVUS",
    productSlug: "avus-genext-genext",
    imageFit: "contain",
  },
  {
    id: "trending-guitar",
    title: "HERTZ HZA4503 Acoustic Guitar",
    excerpt:
      "Warm acoustic tone and comfortable playability — a bestseller for practice and performance.",
    tags: ["Guitars", "Trending"],
    href: productPath("hertz-hza4503-hza4503"),
    image: "/images/New Guitar.png",
    brandLabel: "HERTZ",
    productSlug: "hertz-hza4503-hza4503",
    pinImage: true,
    imageFit: "contain",
  },
  {
    id: "trending-mixer",
    title: "ADEON AMS84F Professional Audio Mixer Console",
    excerpt:
      "USB and Bluetooth mixing for DJs, karaoke, live sound, and home recording setups.",
    tags: ["Live Sound", "Trending"],
    href: productPath("adeon-ams84f-ams84f"),
    image:
      "https://cdn.vibemusic.in/products/live-sound-lighting/adeon-ams84f-ams84f/e5cbfc73-4ff2-4822-a93c-320d6607cd06.png",
    brandLabel: "ADEON",
    productSlug: "adeon-ams84f-ams84f",
    imageFit: "contain",
  },
];

export const HOMEPAGE_TRENDING_CTA = "/search/results?q=trending";
