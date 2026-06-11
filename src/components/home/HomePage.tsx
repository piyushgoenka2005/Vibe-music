import Careers from "@/components/sections/Careers/Careers";
import Hero from "@/components/sections/Hero/Hero";
import HeroTiles from "@/components/sections/HeroTiles/HeroTiles";
import HottestDeals from "@/components/sections/HottestDeals/HottestDeals";
import HottestDealsDynamic from "@/components/sections/HottestDealsDynamic/HottestDealsDynamic";
import NewAndNotable from "@/components/sections/NewAndNotable/NewAndNotable";
import PopularCategories from "@/components/sections/PopularCategories/PopularCategories";
import ResearchArticles from "@/components/sections/ResearchArticles/ResearchArticles";
import SalesEngineer from "@/components/sections/SalesEngineer/SalesEngineer";
import SuggestedGXProducts from "@/components/sections/SuggestedGXProducts/SuggestedGXProducts";
import SuggestedProducts from "@/components/sections/SuggestedProducts/SuggestedProducts";
import TopNewProducts from "@/components/sections/TopNewProducts/TopNewProducts";
import ValueAdds from "@/components/sections/ValueAdds/ValueAdds";
import WelcomeSection from "@/components/sections/WelcomeSection/WelcomeSection";
import { HERO_SLIDES } from "@/data/heroSlides";

export default function HomePage() {
  return (
    <main>
      <h1 className="visually-hidden">{HERO_SLIDES.visuallyHiddenTitle}</h1>

      <div
        id="hp-expected-sections"
        data-cy="expected-sections"
        data-expected-section-ids={HERO_SLIDES.expectedSectionIds}
        aria-hidden="true"
        className="visually-hidden"
        hidden
      />

      <Hero />

      <div className="homepage-wrapper" id="main-content">
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
        <SalesEngineer />
        <SuggestedGXProducts />
        <HottestDealsDynamic />
        <ResearchArticles />
        <Careers />
      </div>
    </main>
  );
}
