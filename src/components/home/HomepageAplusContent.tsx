import AplusStoryBanners from "@/components/common/AplusStoryBanners";
import { getHomepageStoryBanners } from "@/lib/server/homepageStoryService";

export default async function HomepageAplusContent() {
  const data = await getHomepageStoryBanners();

  if (!data.isActive || data.banners.length === 0) {
    return null;
  }

  return (
    <section
      className="homepage-aplus"
      data-vibe-section="homepage-aplus"
      aria-label={data.sectionTitle || "Featured gear stories"}
    >
      <AplusStoryBanners banners={data.banners} />
    </section>
  );
}
