import { listGearStories } from "@/lib/server/gearStoryService";
import GearStoriesSection from "@/components/home/GearStoriesSection";

export default async function GearStoriesReelsSection() {
  const data = await listGearStories();

  return <GearStoriesSection data={data} />;
}
