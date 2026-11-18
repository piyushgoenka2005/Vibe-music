"use client";

import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import type { HomepageBannerSlide } from "@/data/homepageBannerHero";
import { mapBannersToSlides, slidesFingerprint } from "@/lib/banners/mapBannerToSlide";
import { pickHomepageBannerSlides } from "@/lib/banners/pickHomepageBannerSlides";
import type { HomepageBanner } from "@/types/banner";

const HOMEPAGE_BANNERS_QUERY_KEY = ["homepage-banners"] as const;
/** Storefront polls every 30 seconds matching the admin banner publication window. */
const HOMEPAGE_BANNERS_STALE_MS = 15_000;
const HOMEPAGE_BANNERS_REFETCH_MS = 30_000;

async function fetchActiveBannerSlides(): Promise<HomepageBannerSlide[]> {
  try {
    const response = await fetch("/api/banners", { cache: "no-store" });
    if (!response.ok) return [];
    const body = (await response.json()) as { banners?: HomepageBanner[] };
    const banners = body.banners ?? [];
    if (banners.length === 0) return [];
    return mapBannersToSlides(banners);
  } catch {
    return [];
  }
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
    refetchOnMount: true,
  });

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleCustomEvent = () => {
      void query.refetch();
    };

    const handleStorageEvent = (event: StorageEvent) => {
      if (event.key === "vibe:banners-updated") {
        void query.refetch();
      }
    };

    window.addEventListener("vibe:banners-updated", handleCustomEvent);
    window.addEventListener("storage", handleStorageEvent);

    return () => {
      window.removeEventListener("vibe:banners-updated", handleCustomEvent);
      window.removeEventListener("storage", handleStorageEvent);
    };
  }, [query]);

  const slides = pickHomepageBannerSlides(query.data, initialSlides);

  return {
    slides,
    isRefreshing: query.isFetching && !query.isLoading,
    fingerprint: slidesFingerprint(slides),
  };
}
