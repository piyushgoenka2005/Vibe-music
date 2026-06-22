"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchProductReviewStats } from "@/services/review.service";
import type { ProductReviewStats } from "@/types/review";

const EMPTY_STATS: ProductReviewStats = {
  productId: "",
  totalReviews: 0,
  averageRating: 0,
  distribution: { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0 },
  verifiedCount: 0,
  withImagesCount: 0,
  lastReviewAt: null,
  updatedAt: "",
};

export function useProductReviewStats(slug: string) {
  return useQuery({
    queryKey: ["product-review-stats", slug],
    queryFn: async () => {
      try {
        return await fetchProductReviewStats(slug);
      } catch {
        return { ...EMPTY_STATS, productId: slug };
      }
    },
    enabled: Boolean(slug),
    staleTime: 60_000,
    retry: false,
  });
}
