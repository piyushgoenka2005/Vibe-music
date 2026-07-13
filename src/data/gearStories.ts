import type { GearStorySeed } from "@/types/gear-story";
import { getMirroredReelVideoUrl } from "@/data/reelVideos";

export const GEAR_STORIES_SECTION = {
  title: "Gear style stories",
  subtitle: "Discover instruments in action.",
} as const;

/**
 * CMS-ready seeds — productIds must match live catalog rows.
 * Copy is aligned to the Hertz / AVUS / ADEON products currently stocked.
 */
export const GEAR_STORY_SEEDS: GearStorySeed[] = [
  {
    id: "gs-1",
    title: "Hertz HZA-UK(24)",
    productId: "prod-hertz-hertz-hza-uk-24-hertz-hza-uk-24",
    videoUrl: getMirroredReelVideoUrl(0),
    description:
      "Compact concert-scale playability with a bright, projecting voice — ideal for practice, classes, and intimate gigs.",
    features: [
      "Concert-friendly scale length",
      "Stage-ready gloss finish",
      "Inspected and set up by Vibe Music",
      "Beginner to intermediate friendly",
      "Lightweight for travel & studio",
    ],
  },
  {
    id: "gs-2",
    title: "Hertz HZA-3600",
    productId: "prod-hertz-hza-3600-hza-3600",
    videoUrl: getMirroredReelVideoUrl(1),
    description:
      "Natural-finish full-size acoustic with balanced tone for lessons, songwriting, and casual stage work.",
    features: [
      "Full-size wooden body",
      "Natural finish",
      "Comfortable neck profile",
      "Ready for practice & performance",
      "Great first serious acoustic",
    ],
  },
  {
    id: "gs-3",
    title: "Hertz HZA-3900",
    productId: "prod-hertz-hza-3900-hza-3900",
    videoUrl: getMirroredReelVideoUrl(2),
    description:
      "Tobacco sunburst, natural, and black finish options — a versatile acoustic for learning and live sets.",
    features: [
      "Multiple finish options",
      "Full-size wooden construction",
      "Warm midrange response",
      "Student to intermediate ready",
      "Checked by Vibe Music techs",
    ],
  },
  {
    id: "gs-4",
    title: "Hertz HZA4040 EQ",
    productId: "prod-hertz-hza4040-eq-hza4040-eq",
    videoUrl: getMirroredReelVideoUrl(3),
    description:
      "Solid-top electro-acoustic with built-in EQ — plug in for rehearsals, open mics, and small venues.",
    features: [
      "Solid top construction",
      "Onboard EQ electronics",
      "Natural finish",
      "Stage and studio ready",
      "Includes professional setup",
    ],
  },
  {
    id: "gs-5",
    title: "AVUS Distack 10\"",
    productId: "prod-avus-avus-distack-10-avus-distack-10",
    videoUrl: getMirroredReelVideoUrl(4),
    description:
      "Fast, cutting 10\" stack cymbal response for accents, effects, and modern drum kits.",
    features: [
      "10\" professional cymbal",
      "Bright stack character",
      "Studio & live versatile",
      "Built for dynamic playing",
      "From the AVUS percussion line",
    ],
  },
  {
    id: "gs-6",
    title: "ADEON AD15DSP",
    productId: "prod-adeon-ad15dsp-ad15dsp",
    videoUrl: getMirroredReelVideoUrl(5),
    description:
      "Active PA with DSP control and strong bass — a portable voice for rehearsals, events, and small venues.",
    features: [
      "Active PA with DSP",
      "Powerful bass response",
      "Clear high-frequency output",
      "Suitable for live & install",
      "ADEON pro audio lineup",
    ],
  },
];
