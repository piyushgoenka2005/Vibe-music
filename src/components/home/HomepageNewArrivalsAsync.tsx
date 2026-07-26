import { getCachedPublicHomepageData } from "@/lib/server/homepageSnapshotCache";
import HomepageProductGridSection from "@/components/homepage/HomepageProductGridSection";

/** Top New Products grid only — kept separate so it can stream ahead of Big Names. */
export default async function HomepageNewArrivalsAsync() {
  const data = await getCachedPublicHomepageData();
  const section = data.sections.find((entry) => entry.key === "new_arrivals");
  if (!section || section.layout !== "product_grid") return null;
  return <HomepageProductGridSection section={section} />;
}
