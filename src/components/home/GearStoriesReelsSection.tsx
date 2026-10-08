import { getCachedGearStories } from "@/lib/server/homepage/gearStoryService";
import GearStoriesSection from "@/components/home/GearStoriesSection";

export default async function GearStoriesReelsSection() {
  const data = await getCachedGearStories();
  if (!data.isActive || data.stories.length === 0) return null;
  return <GearStoriesSection data={data} />;
}
