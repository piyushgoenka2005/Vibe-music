import { getPublicGearStories } from "@/data/gearStoriesPublic";
import GearStoriesSection from "@/components/home/GearStoriesSection";

/** Static homepage strip — avoids DB/catalog latency on every page load. */
export default function GearStoriesReelsSection() {
  const data = getPublicGearStories();
  return <GearStoriesSection data={data} />;
}
