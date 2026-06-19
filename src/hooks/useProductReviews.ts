"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { fetchProductReviews, type ReviewListQuery } from "@/services/review.service";
import type { ReviewSortOption } from "@/types/review";

export interface ProductReviewFilters {
  sort: ReviewSortOption;
  rating?: number;
  verified?: boolean;
  hasImages?: boolean;
}

export function useProductReviews(slug: string, filters: ProductReviewFilters) {
  const query: ReviewListQuery = {
    sort: filters.sort,
    rating: filters.rating,
    verified: filters.verified,
    hasImages: filters.hasImages,
    limit: 10,
  };

  return useInfiniteQuery({
    queryKey: ["product-reviews", slug, query],
    queryFn: ({ pageParam }) =>
      fetchProductReviews(slug, { ...query, cursor: pageParam as string | undefined }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => (lastPage.hasMore ? lastPage.nextCursor : undefined),
    enabled: Boolean(slug),
    staleTime: 30_000,
  });
}
