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
  categoryTag: string;
  hot?: boolean;
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
    eyebrow: "New arrival",
    categoryTag: "Guitars",
    hot: true,
    title: "Hertz TL-6.",
    subtitle: "Tele-style tone in butter blond — built for stage and studio.",
    ctaLabel: "Shop now",
    ctaHref: categoryPath("guitars"),
  },
  {
    eyebrow: "Limited finish",
    categoryTag: "Guitars",
    hot: true,
    title: "Mint green.",
    subtitle: "A fresh take on classic electric guitar design.",
    ctaLabel: "Shop now",
    ctaHref: categoryPath("guitars"),
  },
  {
    eyebrow: "Featured collection",
    categoryTag: "Guitars",
    title: "Legendary tone.",
    subtitle: "Flagship guitars and electric icons — curated for players who demand more.",
    ctaLabel: "Shop now",
    ctaHref: categoryPath("guitars"),
  },
  {
    eyebrow: "Studio setup showcase",
    categoryTag: "Studio",
    hot: true,
    title: "Producer ready.",
    subtitle: "Samplers, keys, and production tools for modern beatmakers and composers.",
    ctaLabel: "Shop now",
    ctaHref: categoryPath("studio-recording"),
  },
  {
    eyebrow: "Pro audio launch",
    categoryTag: "Studio",
    title: "Record without limits.",
    subtitle: "Interfaces and studio essentials trusted in rooms around the world.",
    ctaLabel: "Shop now",
    ctaHref: categoryPath("studio-recording"),
  },
  {
    eyebrow: "Artist-pick collection",
    categoryTag: "Bass",
    title: "Low end. High impact.",
    subtitle: "Precision bass tone — from rehearsal room to sold-out venues.",
    ctaLabel: "Shop now",
    ctaHref: categoryPath("bass"),
  },
  {
    eyebrow: "Live sound spotlight",
    categoryTag: "Live sound",
    hot: true,
    title: "Own the stage.",
    subtitle: "PA systems and live rigs engineered for clarity at any scale.",
    ctaLabel: "Shop now",
    ctaHref: categoryPath("live-sound-lighting"),
  },
  {
    eyebrow: "Limited drop",
    categoryTag: "Deals",
    title: "Serious savings.",
    subtitle: "Big-name brands at prices that move fast — while stock lasts.",
    ctaLabel: "View deals",
    ctaHref: `${ROUTES.searchResults}?q=deals`,
  },
  {
    eyebrow: "Best sellers spotlight",
    categoryTag: "Trending",
    title: "Trending gear.",
    subtitle: "The instruments and tools creators are adding to their rigs right now.",
    ctaLabel: "Explore",
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

/** Shortest-path direction for carousel slide (+1 forward, -1 backward). */
export function getSlideDirection(
  from: number,
  to: number,
  length = HERO_SHOWCASE_SCENES.length
): number {
  if (length <= 1 || from === to) return 1;
  const forward = (to - from + length) % length;
  const backward = (from - to + length) % length;
  return forward <= backward ? 1 : -1;
}
