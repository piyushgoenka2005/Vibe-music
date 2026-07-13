import { getCachedPublicHomepageData } from "@/lib/server/homepageSnapshotCache";
import {
  getHomepagePopularCategoryItems,
  HOMEPAGE_POPULAR_CATEGORY_COUNT,
} from "@/data/popularCategories";
import OutletStorySection from "@/components/home/OutletStorySection";
import HomepageCategoryGridSection from "@/components/homepage/HomepageCategoryGridSection";
import type { ResolvedHomepageSection } from "@/types/homepage";

function fallbackPopularCategoriesSection(): ResolvedHomepageSection {
  return {
    key: "featured_categories",
    sectionId: "popular-categories",
    title: "Popular Categories",
    ctaText: "Browse All Categories",
    ctaLink: "/categories",
    layout: "category_grid",
    categories: getHomepagePopularCategoryItems(HOMEPAGE_POPULAR_CATEGORY_COUNT),
  };
}

/** Welcome + Popular Categories — sits after Category Bento / Gear Stories. */
export default async function HomepageOutletCategoriesBlock() {
  const data = await getCachedPublicHomepageData();
  const section =
    data.sections.find((item) => item.key === "featured_categories") ??
    fallbackPopularCategoriesSection();

  return (
    <>
      <OutletStorySection />
      <HomepageCategoryGridSection section={section} />
    </>
  );
}
