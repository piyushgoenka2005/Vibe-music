import { Suspense } from "react";
import PremiumHero from "@/components/home/PremiumHero";
import HomepageStats from "@/components/home/HomepageStats";
import HomepagePromoBanner from "@/components/home/HomepagePromoBanner";
import ServiceStatusCarousel from "@/components/home/ServiceStatusCarousel";
import WhyShopSection from "@/components/home/WhyShopSection";
import BrowseCategoryCardsSection from "@/components/home/BrowseCategoryCardsSection";
import SocialProofStrip from "@/components/home/SocialProofStrip";
import DiscoverLocationsSection from "@/components/home/DiscoverLocationsSection";
import BigNamesDealsSection from "@/components/home/BigNamesDealsSection";
import CategoryBento from "@/components/home/CategoryBento";
import OutletStorySection from "@/components/home/OutletStorySection";
import GearStoriesReelsSection from "@/components/home/GearStoriesReelsSection";
import EditorialSplit from "@/components/home/EditorialSplit";
import HomepageBlogTeaser from "@/components/home/HomepageBlogTeaser";
import BlogTeaserSkeleton from "@/components/home/BlogTeaserSkeleton";
import HomepageSectionsAsync from "@/components/homepage/HomepageSectionsAsync";
import HomepageSectionsSkeleton from "@/components/homepage/HomepageSectionsSkeleton";

export default function HomePage() {
  return (
    <main className="premium-home">
      <h1 className="visually-hidden">Vibe Music — Musical Instruments & Pro Audio</h1>

      <PremiumHero />
      <HomepageStats />
      <HomepagePromoBanner />
      <ServiceStatusCarousel />
      <WhyShopSection />
      <BrowseCategoryCardsSection />
      <GearStoriesReelsSection />
      <BigNamesDealsSection />
      <CategoryBento />
      <OutletStorySection />

      <Suspense fallback={<HomepageSectionsSkeleton />}>
        <HomepageSectionsAsync />
      </Suspense>

      <EditorialSplit />

      <Suspense fallback={<BlogTeaserSkeleton />}>
        <HomepageBlogTeaser />
      </Suspense>

      <DiscoverLocationsSection />
      <SocialProofStrip />
    </main>
  );
}
