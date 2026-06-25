import AplusStoryBanners from "@/components/common/AplusStoryBanners";
import { HOMEPAGE_APLUS_BANNERS } from "@/data/homepageAplusSections";

export default function HomepageAplusContent() {
  return (
    <section
      className="homepage-aplus"
      data-vibe-section="homepage-aplus"
      aria-label="Featured gear stories"
    >
      <AplusStoryBanners banners={HOMEPAGE_APLUS_BANNERS} />
    </section>
  );
}
