import { getCachedGearStories } from "@/lib/server/gearStoryService";
import GearStoriesSection from "@/components/home/GearStoriesSection";

export default async function GearStoriesReelsSection() {
  const data = await getCachedGearStories();

  return <GearStoriesSection data={data} />;
}
