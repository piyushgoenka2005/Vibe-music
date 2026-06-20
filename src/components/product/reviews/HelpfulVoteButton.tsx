"use client";

import { useReviewVote } from "@/hooks/useReviewVote";
import { useAuthStore } from "@/store/authStore";
import { useToastStore } from "@/store/toastStore";

interface HelpfulVoteButtonProps {
  reviewId: string;
  productSlug: string;
  count: number;
  hasVoted?: boolean;
}

export default function HelpfulVoteButton({
  reviewId,
  productSlug,
  count,
  hasVoted = false,
}: HelpfulVoteButtonProps) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const showToast = useToastStore((s) => s.show);
  const voteMutation = useReviewVote(productSlug);

  function handleVote() {
    if (!isAuthenticated) {
      showToast("Sign in to mark reviews as helpful", "info");
      return;
    }
    if (hasVoted || voteMutation.isPending) return;

    voteMutation.mutate(reviewId, {
      onError: (error) => {
        showToast(error instanceof Error ? error.message : "Unable to vote", "error");
      },
    });
  }

  const voted = hasVoted || voteMutation.isSuccess;
  const displayCount =
    voteMutation.isSuccess && typeof voteMutation.data === "number"
      ? voteMutation.data
      : count;

  return (
    <button
      type="button"
      className={`pdp-review-helpful${voted ? " pdp-review-helpful--voted" : ""}`}
      onClick={handleVote}
      disabled={voted || voteMutation.isPending}
      aria-pressed={voted}
    >
      Helpful ({displayCount})
    </button>
  );
}
