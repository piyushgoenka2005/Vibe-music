import { getPublicHomepageData } from "@/lib/server/homepageService";
import HomepageSectionRenderer from "@/components/homepage/HomepageSectionRenderer";
import HomepageSectionsShell from "@/components/homepage/HomepageSectionsShell";

export default async function HomepageSectionsAsync() {
  const data = await getPublicHomepageData();

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
