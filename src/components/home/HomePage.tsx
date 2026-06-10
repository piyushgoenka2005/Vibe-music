import PopularCategories from "@/components/sections/PopularCategories/PopularCategories";
import WelcomeSection from "@/components/sections/WelcomeSection/WelcomeSection";
import HtmlChunk from "@/components/vibe/HtmlChunk";

export default function HomePage() {
  return (
    <>
      <HtmlChunk name="main-head" />
      <WelcomeSection />
      <PopularCategories />
      <HtmlChunk name="main-tail" />
    </>
  );
}
