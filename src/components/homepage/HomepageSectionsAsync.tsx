import { getCachedPublicHomepageData } from "@/lib/server/homepageSnapshotCache";
import HomepageSectionRenderer from "@/components/homepage/HomepageSectionRenderer";
import HomepageSectionsShell from "@/components/homepage/HomepageSectionsShell";
import HomepageTopProducts from "@/components/home/HomepageTopProducts";
import TourRibbonSection from "@/components/home/TourRibbonSection";
import type { ResolvedHomepageSection } from "@/types/homepage";

/**
 * Fixed stack:
 * Trending → (Tour Ribbon) → Staff Picks → … → Popular Categories →
 * Find Your Product → Deals → Shop Top Brands → (Shop the highlights)
 * `new_arrivals` is rendered earlier on the page (before Big Names deals).
 */
function orderHomepageSections(
  sections: ResolvedHomepageSection[]
): ResolvedHomepageSection[] {
  const trending = sections.find((section) => section.key === "trending");
  const staffPicks = sections.find((section) => section.key === "staff_picks");
  const categories = sections.find((section) => section.key === "featured_categories");
  const deals = sections.find((section) => section.key === "deals_of_the_day");
  const brands = sections.find((section) => section.key === "brand_strip");
  const rest = sections.filter(
    (section) =>
      section.key !== "trending" &&
      section.key !== "staff_picks" &&
      section.key !== "featured_categories" &&
      section.key !== "deals_of_the_day" &&
      section.key !== "brand_strip" &&
      section.key !== "new_arrivals"
  );

  const ordered: ResolvedHomepageSection[] = [];
  if (trending) ordered.push(trending);
  if (staffPicks) ordered.push(staffPicks);
  ordered.push(...rest);
  if (categories) ordered.push(categories);
  if (deals) ordered.push(deals);
  if (brands) ordered.push(brands);
  return ordered;
}

export default async function HomepageSectionsAsync() {
  const data = await getCachedPublicHomepageData();
  const sections = orderHomepageSections(data.sections);

  if (sections.length === 0) {
    return null;
  }

  const hasCategories = sections.some((section) => section.key === "featured_categories");
  const hasDeals = sections.some((section) => section.key === "deals_of_the_day");
  const hasBrands = sections.some((section) => section.key === "brand_strip");

  return (
    <HomepageSectionsShell>
      {sections.map((section) => (
        <div key={section.key}>
          <HomepageSectionRenderer
            attachFindYourProduct={
              section.key === "featured_categories" ||
              (!hasCategories && section.key === "deals_of_the_day") ||
              (!hasCategories && !hasDeals && section.key === "brand_strip")
            }
            section={section}
          />
          {section.key === "trending" ? <TourRibbonSection /> : null}
          {section.key === "brand_strip" ? <HomepageTopProducts /> : null}
        </div>
      ))}
      {/* If Shop Top Brands is inactive, still show highlights after the stack. */}
      {!hasBrands ? <HomepageTopProducts /> : null}
    </HomepageSectionsShell>
  );
}
