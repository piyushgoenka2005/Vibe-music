import HomepageBrandStripSection from "@/components/homepage/HomepageBrandStripSection";
import HomepageCategoryGridSection from "@/components/homepage/HomepageCategoryGridSection";
import HomepageDealsSection from "@/components/homepage/HomepageDealsSection";
import HomepageProductCarouselSection from "@/components/homepage/HomepageProductCarouselSection";
import HomepageProductGridSection from "@/components/homepage/HomepageProductGridSection";
import FindYourProductSectionLazy from "@/components/home/find-your-product/FindYourProductSectionLazy";
import type { ResolvedHomepageSection } from "@/types/homepage";

interface HomepageSectionRendererProps {
  section: ResolvedHomepageSection;
  /** Insert Find Your Product after Popular Categories (or before Deals/Brands as fallback). */
  attachFindYourProduct?: boolean;
}

export default function HomepageSectionRenderer({
  section,
  attachFindYourProduct = false,
}: HomepageSectionRendererProps) {
  switch (section.layout) {
    case "product_grid":
      return <HomepageProductGridSection section={section} />;
    case "product_carousel":
      return <HomepageProductCarouselSection section={section} />;
    case "category_grid":
      if (attachFindYourProduct) {
        return (
          <>
            <HomepageCategoryGridSection section={section} />
            <FindYourProductSectionLazy />
          </>
        );
      }
      return <HomepageCategoryGridSection section={section} />;
    case "deals_slider":
      if (section.key === "deals_of_the_day" && attachFindYourProduct) {
        return (
          <>
            <FindYourProductSectionLazy />
            <HomepageDealsSection section={section} />
          </>
        );
      }
      return <HomepageDealsSection section={section} />;
    case "brand_strip":
      if (attachFindYourProduct) {
        return (
          <>
            <FindYourProductSectionLazy />
            <HomepageBrandStripSection section={section} />
          </>
        );
      }
      return <HomepageBrandStripSection section={section} />;
    default:
      return null;
  }
}
