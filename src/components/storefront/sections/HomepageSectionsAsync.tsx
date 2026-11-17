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
function orderHomepageSections(sections: ResolvedHomepageSection[]): ResolvedHomepageSection[] {
  const trending = sections.find((section) => section.key === "trending");
  const staffPicks = sections.find((section) => section.key === "staff_picks");
  const categories = sections.find((section) => section.key === "featured_categories");
  const findYourProduct = sections.find((section) => section.key === "find_your_product");
  const deals = sections.find((section) => section.key === "deals_of_the_day");
  const brands = sections.find((section) => section.key === "brand_strip");
  const rest = sections.filter(
    (section) =>
      section.key !== "trending" &&
      section.key !== "staff_picks" &&
      section.key !== "featured_categories" &&
      section.key !== "find_your_product" &&
      section.key !== "deals_of_the_day" &&
      section.key !== "brand_strip" &&
      section.key !== "new_arrivals" &&
      section.key !== "shop_the_highlights" &&
      section.key !== "gear_stories" &&
      section.key !== "gear_advisors" &&
      section.key !== "trending_buys",
  );

  const ordered: ResolvedHomepageSection[] = [];
  if (trending) ordered.push(trending);
  if (staffPicks) ordered.push(staffPicks);
  ordered.push(...rest);
  if (categories) ordered.push(categories);
  if (findYourProduct) ordered.push(findYourProduct);
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

  const hasBrands = sections.some((section) => section.key === "brand_strip");

  return (
    <HomepageSectionsShell>
      {sections.map((section) => (
        <div key={section.key}>
          <HomepageSectionRenderer section={section} />
          {section.key === "trending" ? <TourRibbonSection /> : null}
          {section.key === "brand_strip" ? <HomepageTopProducts /> : null}
        </div>
      ))}
      {/* If Shop Top Brands is inactive, still show highlights after the stack. */}
      {!hasBrands ? <HomepageTopProducts /> : null}
    </HomepageSectionsShell>
  );
}
