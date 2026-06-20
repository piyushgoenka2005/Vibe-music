import { getCachedPublicHomepageData } from "@/lib/server/homepageSnapshotCache";
import HomepageSectionRenderer from "@/components/homepage/HomepageSectionRenderer";
import HomepageSectionsShell from "@/components/homepage/HomepageSectionsShell";

export default async function HomepageSectionsAsync() {
  const data = await getCachedPublicHomepageData();

  if (data.sections.length === 0) {
    return null;
  }

  return (
    <HomepageSectionsShell>
      {data.sections.map((section) => (
        <HomepageSectionRenderer key={section.key} section={section} />
      ))}
    </HomepageSectionsShell>
  );
}
