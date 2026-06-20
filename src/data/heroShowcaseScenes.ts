import {
  MARKETING_HERO_FALLBACK,
  MARKETING_HERO_ROTATE_MS,
  MARKETING_HERO_SLIDES,
  type MarketingHeroSlide,
} from "@/data/marketingHeroSlides";
import { categoryPath, ROUTES } from "@/lib/routes";

export { MARKETING_HERO_FALLBACK, MARKETING_HERO_ROTATE_MS };

export interface HeroShowcaseScene {
  id: string;
  src: string;
  alt: string;
  fit?: MarketingHeroSlide["fit"];
  objectPosition?: string;
  eyebrow: string;
  title: string;
  subtitle: string;
  ctaLabel: string;
  ctaHref: string;
}

const SCENE_META: Omit<
  HeroShowcaseScene,
  "id" | "src" | "alt" | "fit" | "objectPosition"
>[] = [
  {
    eyebrow: "Featured collection",
    title: "Legendary tone.",
    subtitle: "Flagship guitars and electric icons — curated for players who demand more.",
    ctaLabel: "Shop guitars",
    ctaHref: categoryPath("guitars"),
  },
  {
    eyebrow: "Drum Month spotlight",
    title: "Feel the impact.",
    subtitle: "Acoustic kits, electronic rigs, and percussion built for the main stage.",
    ctaLabel: "Shop drums",
    ctaHref: categoryPath("drums-percussion"),
  },
  {
    eyebrow: "Studio setup showcase",
    title: "Producer ready.",
    subtitle: "Samplers, keys, and production tools for modern beatmakers and composers.",
    ctaLabel: "Shop studio",
    ctaHref: categoryPath("studio-recording"),
  },
  {
    eyebrow: "Pro audio launch",
    title: "Record without limits.",
    subtitle: "Interfaces and studio essentials trusted in rooms around the world.",
    ctaLabel: "Shop interfaces",
    ctaHref: categoryPath("studio-recording"),
  },
  {
    eyebrow: "Artist-pick collection",
    title: "Low end. High impact.",
    subtitle: "Precision bass tone — from rehearsal room to sold-out venues.",
    ctaLabel: "Shop bass",
    ctaHref: categoryPath("bass"),
  },
  {
    eyebrow: "Live sound spotlight",
    title: "Own the stage.",
    subtitle: "PA systems and live rigs engineered for clarity at any scale.",
    ctaLabel: "Shop live sound",
    ctaHref: categoryPath("live-sound-lighting"),
  },
  {
    eyebrow: "Limited drop",
    title: "Serious savings.",
    subtitle: "Big-name brands at prices that move fast — while stock lasts.",
    ctaLabel: "View deals",
    ctaHref: `${ROUTES.searchResults}?q=deals`,
  },
  {
    eyebrow: "Best sellers spotlight",
    title: "Trending gear.",
    subtitle: "The instruments and tools creators are adding to their rigs right now.",
    ctaLabel: "Explore gear",
    ctaHref: ROUTES.search,
  },
];

export const HERO_SHOWCASE_SCENES: HeroShowcaseScene[] = MARKETING_HERO_SLIDES.map(
  (slide, index) => ({
    id: `hero-scene-${index}`,
    src: slide.src,
    alt: slide.alt,
    fit: slide.fit,
    objectPosition: slide.objectPosition,
    ...SCENE_META[index]!,
  })
);

export function wrapSceneIndex(index: number, length = HERO_SHOWCASE_SCENES.length): number {
  if (length === 0) return 0;
  return ((index % length) + length) % length;
}
