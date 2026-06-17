import { buildStaticGearStories } from "@/lib/server/gearStoryService";
import GearStoriesSection from "@/components/home/GearStoriesSection";

/** Homepage gear reels — static local videos, no Firestore Suspense. */
export default function GearStoriesReelsSection() {
  const data = buildStaticGearStories();

  return <GearStoriesSection data={data} />;
}
