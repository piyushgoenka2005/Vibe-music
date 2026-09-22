import { getCachedHomepageStoryBanners } from "@/lib/server/homepageSnapshotCache";
import AplusStoryBanners from "@/components/common/AplusStoryBanners";

export default async function HomepageAplusContent() {
  const data = await getCachedHomepageStoryBanners();
  if (!data.isActive || data.banners.length === 0) return null;
  return <AplusStoryBanners banners={data.banners} />;
}
