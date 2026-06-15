import { Suspense } from "react";
import "@/components/homepage/homepage-dynamic.css";
import HomepageBannerCarousel from "@/components/sections/HomepageBanner/HomepageBannerCarousel";
import HomepageSectionsAsync from "@/components/homepage/HomepageSectionsAsync";
import HomepageSectionsSkeleton from "@/components/homepage/HomepageSectionsSkeleton";
import type { HomepageBanner } from "@/types/banner";

interface HomePageProps {
  banners: HomepageBanner[];
}

export default function HomePage({ banners }: HomePageProps) {
  return (
    <main>
      <h1 className="visually-hidden">Vibe Music — Musical Instruments & Pro Audio</h1>

      <HomepageBannerCarousel banners={banners} />

      <Suspense fallback={<HomepageSectionsSkeleton />}>
        <HomepageSectionsAsync />
      </Suspense>
    </main>
  );
}
