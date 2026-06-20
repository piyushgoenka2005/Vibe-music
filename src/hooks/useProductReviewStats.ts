"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchProductReviewStats } from "@/services/review.service";

export function useProductReviewStats(slug: string) {
  return useQuery({
    queryKey: ["product-review-stats", slug],
    queryFn: () => fetchProductReviewStats(slug),
    enabled: Boolean(slug),
    staleTime: 60_000,
  });
}
