import { getCachedPublicHomepageData } from "@/lib/server/homepageSnapshotCache";
import HomepageSectionRenderer from "@/components/homepage/HomepageSectionRenderer";
import HomepageSectionsShell from "@/components/homepage/HomepageSectionsShell";
import HomepageTopProducts from "@/components/home/HomepageTopProducts";
import type { ResolvedHomepageSection } from "@/types/homepage";

/**
 * Keep Popular Categories → Find Your Product → Deals → Shop Top Brands
 * as a fixed block near the bottom of the dynamic section stack.
 * `new_arrivals` is rendered earlier on the page (before Big Names deals).
 */
function orderHomepageSections(
  sections: ResolvedHomepageSection[]
): ResolvedHomepageSection[] {
  const categories = sections.find((section) => section.key === "featured_categories");
  const deals = sections.find((section) => section.key === "deals_of_the_day");
  const brands = sections.find((section) => section.key === "brand_strip");
  const rest = sections.filter(
    (section) =>
      section.key !== "featured_categories" &&
      section.key !== "deals_of_the_day" &&
      section.key !== "brand_strip" &&
      section.key !== "new_arrivals"
  );

  const ordered = [...rest];
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
  const hasTrending = sections.some((section) => section.key === "trending");

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
          {section.key === "trending" ? <HomepageTopProducts /> : null}
        </div>
      ))}
      {/* If trending is inactive/missing, still show highlights after carousels. */}
      {!hasTrending ? <HomepageTopProducts /> : null}
    </HomepageSectionsShell>
  );
}
