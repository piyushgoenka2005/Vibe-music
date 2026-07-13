import { getCachedPublicHomepageData } from "@/lib/server/homepageSnapshotCache";
import HomepageSectionRenderer from "@/components/homepage/HomepageSectionRenderer";
import HomepageSectionsShell from "@/components/homepage/HomepageSectionsShell";
import type { ResolvedHomepageSection } from "@/types/homepage";

/** Keep Deals Of The Day immediately above Shop Top Brands. */
function orderHomepageSections(
  sections: ResolvedHomepageSection[]
): ResolvedHomepageSection[] {
  const deals = sections.find((section) => section.key === "deals_of_the_day");
  const brands = sections.find((section) => section.key === "brand_strip");
  const rest = sections.filter(
    (section) =>
      section.key !== "featured_categories" &&
      section.key !== "deals_of_the_day" &&
      section.key !== "brand_strip"
  );

  const ordered = [...rest];
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

  const hasDeals = sections.some((section) => section.key === "deals_of_the_day");

  return (
    <HomepageSectionsShell>
      {sections.map((section) => (
        <HomepageSectionRenderer
          key={section.key}
          attachFindYourProduct={
            section.key === "deals_of_the_day" ||
            (!hasDeals && section.key === "brand_strip")
          }
          section={section}
        />
      ))}
    </HomepageSectionsShell>
  );
}
