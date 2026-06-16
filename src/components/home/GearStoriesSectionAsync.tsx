import { listGearStories } from "@/lib/server/gearStoryService";
import GearStoriesSection from "@/components/home/GearStoriesSection";

export default async function GearStoriesSectionAsync() {
  const data = await listGearStories();
  if (data.stories.length === 0) return null;
  return <GearStoriesSection data={data} />;
}
