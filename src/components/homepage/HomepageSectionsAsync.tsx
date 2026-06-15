import { getPublicHomepageData } from "@/lib/server/homepageService";
import HomepageSectionRenderer from "@/components/homepage/HomepageSectionRenderer";

export default async function HomepageSectionsAsync() {
  const data = await getPublicHomepageData();

  return (
    <div className="homepage-wrapper" id="main-content">
      {data.sections.map((section) => (
        <HomepageSectionRenderer key={section.key} section={section} />
      ))}
    </div>
  );
}
