import dynamic from "next/dynamic";
import { Suspense } from "react";
import "@/styles/homepage-bundle.css";
import HomepageSectionsAsync from "@/components/homepage/HomepageSectionsAsync";
import HomepageSectionsSkeleton from "@/components/homepage/HomepageSectionsSkeleton";
import BlogTeaserSkeleton from "@/components/home/BlogTeaserSkeleton";

const HeroShowcaseSection = dynamic(
  () => import("@/components/home/hero-showcase"),
  { loading: () => null }
);
const PremiumHero = dynamic(() => import("@/components/home/PremiumHero"), {
  loading: () => null,
});
const HomepageBlogTeaser = dynamic(
  () => import("@/components/home/HomepageBlogTeaser"),
  { loading: () => <BlogTeaserSkeleton /> }
);

const HomepageStats = dynamic(() => import("@/components/home/HomepageStats"), {
  loading: () => null,
});
const HomepagePromoBanner = dynamic(
  () => import("@/components/home/HomepagePromoBanner"),
  { loading: () => null }
);
const WhyShopSection = dynamic(() => import("@/components/home/WhyShopSection"), {
  loading: () => null,
});
const BrowseCategoryCardsSection = dynamic(
  () => import("@/components/home/BrowseCategoryCardsSection"),
  { loading: () => null }
);
const SocialProofStrip = dynamic(() => import("@/components/home/SocialProofStrip"), {
  loading: () => null,
});
const DiscoverLocationsSection = dynamic(
  () => import("@/components/home/DiscoverLocationsSection"),
  { loading: () => null }
);
const OutletStorySection = dynamic(
  () => import("@/components/home/OutletStorySection"),
  { loading: () => null }
);
const EditorialSplit = dynamic(() => import("@/components/home/EditorialSplit"), {
  loading: () => null,
});
const HomepageAplusContent = dynamic(
  () => import("@/components/home/HomepageAplusContent"),
  { loading: () => null }
);

const ServiceStatusCarousel = dynamic(
  () => import("@/components/home/ServiceStatusCarousel"),
  { loading: () => null }
);

const GearStoriesReelsSection = dynamic(
  () => import("@/components/home/GearStoriesReelsSection"),
  { loading: () => null }
);

const BigNamesDealsSection = dynamic(
  () => import("@/components/home/BigNamesDealsSection"),
  { loading: () => null }
);

const CategoryBento = dynamic(() => import("@/components/home/CategoryBento"), {
  loading: () => null,
});

const CultureTypographySection = dynamic(
  () => import("@/components/home/CultureTypographySection"),
  { loading: () => null }
);

export default function HomePage() {
  return (
    <main className="premium-home">
      <h1 className="visually-hidden">Vibe Music — Musical Instruments & Pro Audio</h1>

      <HeroShowcaseSection />
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

      <HomepageAplusContent />

      <EditorialSplit />

      <Suspense fallback={<BlogTeaserSkeleton />}>
        <HomepageBlogTeaser />
      </Suspense>

      <CultureTypographySection />

      <DiscoverLocationsSection />
      <SocialProofStrip />
    </main>
  );
}
