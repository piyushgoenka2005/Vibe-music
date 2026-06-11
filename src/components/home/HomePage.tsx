import HeroTiles from "@/components/sections/HeroTiles/HeroTiles";
import HottestDeals from "@/components/sections/HottestDeals/HottestDeals";
import NewAndNotable from "@/components/sections/NewAndNotable/NewAndNotable";
import PopularCategories from "@/components/sections/PopularCategories/PopularCategories";
import SuggestedProducts from "@/components/sections/SuggestedProducts/SuggestedProducts";
import TopNewProducts from "@/components/sections/TopNewProducts/TopNewProducts";
import ValueAdds from "@/components/sections/ValueAdds/ValueAdds";
import WelcomeSection from "@/components/sections/WelcomeSection/WelcomeSection";
import HtmlChunk from "@/components/vibe/HtmlChunk";

export default function HomePage() {
  return (
    <>
      <HtmlChunk name="main-head" />
      <WelcomeSection />
      <PopularCategories />
      <section
        id="sales-events"
        className="sale-events bg-gray50 text-black fw-containered self-spaced"
      >
        <HottestDeals />
        <NewAndNotable />
      </section>
      <HeroTiles />
      <SuggestedProducts />
      <ValueAdds />
      <TopNewProducts />
      <HtmlChunk name="main-tail" />
    </>
  );
}
