import type { GearStorySeed } from "@/types/gear-story";

export const GEAR_STORIES_SECTION = {
  title: "Gear style stories",
  subtitle: "Discover instruments in action.",
} as const;

/** CMS-ready seeds — enriched with live catalog data via gearStoryService. */
export const GEAR_STORY_SEEDS: GearStorySeed[] = [];
