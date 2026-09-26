import { GEAR_STORIES_SECTION, GEAR_STORY_SEEDS } from "@/data/gearStories";
import { getMirroredReelVideoUrl } from "@/data/reelVideos";
import { STYLE_STORY_REELS } from "@/data/styleStory";
import type { GearStoriesSectionData, GearStory } from "@/types/gear-story";

/**
 * Synchronous homepage payload — no DB/catalog I/O on the critical path.
 * Keeps the Gear Stories strip instant on first paint after deploy.
 */
export function getPublicGearStories(): GearStoriesSectionData {
  return {
    title: GEAR_STORIES_SECTION.title,
    subtitle: GEAR_STORIES_SECTION.subtitle,
    stories: GEAR_STORY_SEEDS.map((seed, index) => buildPublicStory(seed, index)),
  };
}

function buildPublicStory(seed: (typeof GEAR_STORY_SEEDS)[number], index: number): GearStory {
  const reel = STYLE_STORY_REELS[index];
  const posterUrl =
    reel?.thumbnailSrc?.trim() ||
    (index % 2 === 0 ? "/images/guitar-1.webp" : "/images/guitar-2.webp");

  return {
    id: seed.id,
    title: seed.title,
    productId: seed.productId,
    videoUrl: getMirroredReelVideoUrl(index),
    posterUrl,
    category: "guitars",
    price: 0,
    originalPrice: 0,
    salePrice: null,
    discountPercentage: 0,
    description: seed.description,
    features: seed.features,
    slug: "",
    brand: seed.title.split(" ")[0] ?? "Vibe Music",
    name: seed.title,
    rating: 0,
    reviewCount: 0,
    availability: "out-of-stock",
    image: posterUrl,
    images: posterUrl ? [posterUrl] : [],
  };
}
