"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { voteReviewHelpful } from "@/services/review.service";

export function useReviewVote(slug: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (reviewId: string) => voteReviewHelpful(reviewId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["product-reviews", slug] });
    },
  });
}
