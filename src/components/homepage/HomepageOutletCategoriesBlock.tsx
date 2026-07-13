import { getCachedPublicHomepageData } from "@/lib/server/homepageSnapshotCache";
import {
  getHomepagePopularCategoryItems,
  HOMEPAGE_POPULAR_CATEGORY_COUNT,
} from "@/data/popularCategories";
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

/** Popular Categories fallback block (homepage order uses HomepageSectionsAsync). */
export default async function HomepageOutletCategoriesBlock() {
  const data = await getCachedPublicHomepageData();
  const section =
    data.sections.find((item) => item.key === "featured_categories") ??
    fallbackPopularCategoriesSection();

  return <HomepageCategoryGridSection section={section} />;
}
