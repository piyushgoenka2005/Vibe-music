import { getPublicHomepageData } from "@/lib/server/homepageService";
import HomepageSectionRenderer from "@/components/homepage/HomepageSectionRenderer";
import HomepageSectionsShell from "@/components/homepage/HomepageSectionsShell";

export default async function HomepageSectionsAsync() {
  const data = await getPublicHomepageData();

  return (
    <HomepageSectionsShell>
      {data.sections.map((section) => (
        <HomepageSectionRenderer key={section.key} section={section} />
      ))}
    </HomepageSectionsShell>
  );
}
