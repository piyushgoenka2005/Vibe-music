"use client";

import { useQuery } from "@tanstack/react-query";
import type { HomepageBannerSlide } from "@/data/homepageBannerHero";
import { mapBannersToSlides, slidesFingerprint } from "@/lib/banners/mapBannerToSlide";
import { pickHomepageBannerSlides } from "@/lib/banners/pickHomepageBannerSlides";
import type { HomepageBanner } from "@/types/banner";

const HOMEPAGE_BANNERS_QUERY_KEY = ["homepage-banners"] as const;
/** SSR slides are fresh; only re-check occasionally between deploys/edits. */
const HOMEPAGE_BANNERS_STALE_MS = 5 * 60_000;
const HOMEPAGE_BANNERS_REFETCH_MS = 5 * 60_000;

async function fetchActiveBannerSlides(): Promise<HomepageBannerSlide[]> {
  // Default HTTP caching — lets the browser reuse the payload instead of
  // hammering the origin from every open tab.
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
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  const slides = pickHomepageBannerSlides(query.data, initialSlides);

  return {
    slides,
    isRefreshing: query.isFetching && !query.isLoading,
    fingerprint: slidesFingerprint(slides),
  };
}
