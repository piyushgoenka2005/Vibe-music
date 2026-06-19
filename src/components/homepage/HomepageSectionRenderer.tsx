import HomepageBrandStripSection from "@/components/homepage/HomepageBrandStripSection";
import HomepageCategoryGridSection from "@/components/homepage/HomepageCategoryGridSection";
import HomepageDealsSection from "@/components/homepage/HomepageDealsSection";
import HomepageProductCarouselSection from "@/components/homepage/HomepageProductCarouselSection";
import HomepageProductGridSection from "@/components/homepage/HomepageProductGridSection";
import HeroMarqueeSection from "@/components/home/HeroMarqueeSection";
import type { ResolvedHomepageSection } from "@/types/homepage";

interface HomepageSectionRendererProps {
  section: ResolvedHomepageSection;
}

export default function HomepageSectionRenderer({
  section,
}: HomepageSectionRendererProps) {
  switch (section.layout) {
    case "product_grid":
      return <HomepageProductGridSection section={section} />;
    case "product_carousel":
      return <HomepageProductCarouselSection section={section} />;
    case "category_grid":
      return <HomepageCategoryGridSection section={section} />;
    case "deals_slider":
      return <HomepageDealsSection section={section} />;
    case "brand_strip":
      return (
        <>
          <HeroMarqueeSection />
          <HomepageBrandStripSection section={section} />
        </>
      );
    default:
      return null;
  }
}
