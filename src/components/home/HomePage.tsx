import dynamic from "next/dynamic";
import { Suspense } from "react";
import "@/styles/homepage-bundle.css";
import HomepageBannerHeroSection from "@/components/home/homepage-banner-hero/HomepageBannerHeroSection";
import BrowseCategoryCardsSection from "@/components/home/BrowseCategoryCardsSection";
import HomepageSectionsAsync from "@/components/homepage/HomepageSectionsAsync";
import HomepageSectionsSkeleton from "@/components/homepage/HomepageSectionsSkeleton";
import HomepageNewArrivalsAsync from "@/components/home/HomepageNewArrivalsAsync";
import BlogTeaserSkeleton from "@/components/home/BlogTeaserSkeleton";
import HomepageBlogTeaser from "@/components/home/HomepageBlogTeaser";
import BigNamesDealsSection from "@/components/home/BigNamesDealsSection";

import PremiumHero from "@/components/home/PremiumHero";

// Below-fold components wrapped in Suspense for streaming SSR.
// Each section loads independently — browser renders as chunks arrive.
const HomepageStats = dynamic(() => import("@/components/home/HomepageStats"), {
  loading: () => null,
});
const WhyShopSection = dynamic(() => import("@/components/home/WhyShopSection"), {
  loading: () => null,
});
const SocialProofStrip = dynamic(() => import("@/components/home/SocialProofStrip"), {
  loading: () => null,
});
const DiscoverLocationsSection = dynamic(
  () => import("@/components/home/DiscoverLocationsSection"),
  { loading: () => null },
);
const TourRibbonSection = dynamic(() => import("@/components/home/TourRibbonSection"), {
  loading: () => null,
});
const EditorialSplit = dynamic(() => import("@/components/home/EditorialSplit"), {
  loading: () => null,
});
const HomepageAplusContent = dynamic(() => import("@/components/home/HomepageAplusContent"), {
  loading: () => null,
});

const ServiceStatusCarousel = dynamic(() => import("@/components/home/ServiceStatusCarousel"), {
  loading: () => null,
});

const GearStoriesReelsSection = dynamic(() => import("@/components/home/GearStoriesReelsSection"), {
  loading: () => null,
});

const CategoryBento = dynamic(() => import("@/components/home/CategoryBento"), {
  loading: () => null,
});

const CultureTypographySection = dynamic(
  () => import("@/components/home/CultureTypographySection"),
  { loading: () => null },
);

export default function HomePage() {
  return (
    <main className="premium-home">
      <h1 className="visually-hidden">Vibe Music — Musical Instruments & Pro Audio</h1>

      <HomepageBannerHeroSection />
      <PremiumHero />
      <HomepageStats />

      <Suspense fallback={<HomepageSectionsSkeleton />}>
        <HomepageNewArrivalsAsync />
      </Suspense>

      <Suspense fallback={<HomepageSectionsSkeleton />}>
        <BigNamesDealsSection />
      </Suspense>

      <WhyShopSection />
      <BrowseCategoryCardsSection />

      <Suspense fallback={null}>
        <GearStoriesReelsSection />
      </Suspense>

      <CategoryBento />

      <Suspense fallback={<HomepageSectionsSkeleton />}>
        <HomepageSectionsAsync />
      </Suspense>

      <HomepageAplusContent />

      <EditorialSplit />

      <Suspense fallback={<BlogTeaserSkeleton />}>
        <HomepageBlogTeaser />
      </Suspense>

      <CultureTypographySection />

      <ServiceStatusCarousel />
      <DiscoverLocationsSection />
      <SocialProofStrip />
      <TourRibbonSection />
    </main>
  );
}
