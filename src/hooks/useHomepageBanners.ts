"use client";

import { useQuery } from "@tanstack/react-query";
import {
  HOMEPAGE_BANNER_SLIDES,
  type HomepageBannerSlide,
} from "@/data/homepageBannerHero";
import {
  mapBannersToSlides,
  slidesFingerprint,
} from "@/lib/banners/mapBannerToSlide";
import type { HomepageBanner } from "@/types/banner";

const HOMEPAGE_BANNERS_QUERY_KEY = ["homepage-banners"] as const;
const HOMEPAGE_BANNERS_STALE_MS = 15_000;
const HOMEPAGE_BANNERS_REFETCH_MS = 30_000;

async function fetchActiveBannerSlides(): Promise<HomepageBannerSlide[]> {
  const response = await fetch("/api/banners", { cache: "no-store" });
  if (!response.ok) {
    throw new Error("Unable to load homepage banners");
  }
  const body = (await response.json()) as { banners?: HomepageBanner[] };
  const banners = body.banners ?? [];
  if (banners.length === 0) return [];
  return mapBannersToSlides(banners);
}

export function useHomepageBanners(initialSlides: HomepageBannerSlide[]) {
  const query = useQuery({
    queryKey: HOMEPAGE_BANNERS_QUERY_KEY,
    queryFn: fetchActiveBannerSlides,
    initialData: initialSlides,
    staleTime: HOMEPAGE_BANNERS_STALE_MS,
    refetchInterval: HOMEPAGE_BANNERS_REFETCH_MS,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
  });

  const slides = (() => {
    const fetched = query.data;
    const source = fetched !== undefined ? fetched : initialSlides;
    if (source.length > 0) return source;
    return HOMEPAGE_BANNER_SLIDES;
  })();

  return {
    slides,
    isRefreshing: query.isFetching && !query.isLoading,
    fingerprint: slidesFingerprint(slides),
  };
}
