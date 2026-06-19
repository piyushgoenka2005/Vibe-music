"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchReviewEligibility } from "@/services/review.service";
import { useAuthStore } from "@/store/authStore";

export function useReviewEligibility(slug: string) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isInitialized = useAuthStore((s) => s.isInitialized);

  return useQuery({
    queryKey: ["review-eligibility", slug],
    queryFn: () => fetchReviewEligibility(slug),
    enabled: Boolean(slug) && isInitialized && isAuthenticated,
    staleTime: 30_000,
  });
}
