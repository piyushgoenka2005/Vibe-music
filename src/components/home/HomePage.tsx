import { Suspense } from "react";
import PremiumHero from "@/components/home/PremiumHero";
import HomepageStats from "@/components/home/HomepageStats";
import LandingLiveTicker from "@/components/home/LandingLiveTicker";
import ServiceStatusSection from "@/components/home/ServiceStatusSection";
import TrustStrip from "@/components/home/TrustStrip";
import WhyShopSection from "@/components/home/WhyShopSection";
import SocialProofStrip from "@/components/home/SocialProofStrip";
import DiscoverLocationsSection from "@/components/home/DiscoverLocationsSection";
import BigNamesDealsSection from "@/components/home/BigNamesDealsSection";
import CategoryBento from "@/components/home/CategoryBento";
import GearStoriesSectionAsync from "@/components/home/GearStoriesSectionAsync";
import EditorialSplit from "@/components/home/EditorialSplit";
import HomepageBlogTeaser from "@/components/home/HomepageBlogTeaser";
import HomepageSectionsAsync from "@/components/homepage/HomepageSectionsAsync";
import HomepageSectionsSkeleton from "@/components/homepage/HomepageSectionsSkeleton";
import type { HomepageBanner } from "@/types/banner";

interface HomePageProps {
  banners: HomepageBanner[];
}

export default function HomePage({ banners }: HomePageProps) {
  return (
    <main className="premium-home">
      <h1 className="visually-hidden">Vibe Music — Musical Instruments & Pro Audio</h1>

      <PremiumHero banners={banners} />
      <HomepageStats />
      <LandingLiveTicker variant="hero-bridge" />
      <ServiceStatusSection />
      <TrustStrip />
      <WhyShopSection />
      <BigNamesDealsSection />
      <CategoryBento />

      <Suspense fallback={null}>
        <GearStoriesSectionAsync />
      </Suspense>

      <Suspense fallback={<HomepageSectionsSkeleton />}>
        <HomepageSectionsAsync />
      </Suspense>

      <EditorialSplit />

      <Suspense fallback={null}>
        <HomepageBlogTeaser />
      </Suspense>

      <SocialProofStrip />
      <DiscoverLocationsSection />
    </main>
  );
}
