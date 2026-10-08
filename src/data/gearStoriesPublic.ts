import { buildDefaultGearStoriesSectionData } from "@/lib/gearStoriesConfig";

/**
 * Synchronous fallback when the DB-backed service is unavailable (tests, scripts).
 */
export function getPublicGearStories() {
  return buildDefaultGearStoriesSectionData();
}
