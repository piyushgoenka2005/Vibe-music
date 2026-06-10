import HottestDeals from "@/components/sections/HottestDeals/HottestDeals";
import PopularCategories from "@/components/sections/PopularCategories/PopularCategories";
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
        <HtmlChunk name="main-tail-new-notable" />
      </section>
      <HtmlChunk name="main-tail" />
    </>
  );
}
