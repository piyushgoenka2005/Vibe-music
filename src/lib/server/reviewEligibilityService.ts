import "server-only";

import { hasPurchasedProduct } from "@/lib/server/orderVerificationService";
import {
  getUserReviewForProduct,
  hasUserReviewedProduct,
} from "@/lib/server/reviewRepository";
import type { ReviewEligibility } from "@/types/review";

export async function getReviewEligibility(
  userId: string,
  email: string | null | undefined,
  productId: string
): Promise<ReviewEligibility> {
  const hasExistingReview = await hasUserReviewedProduct(userId, productId);
  if (hasExistingReview) {
    return {
      canReview: false,
      hasExistingReview: true,
      verifiedPurchase: false,
      reason: "You have already reviewed this product.",
    };
  }

  const purchase = await hasPurchasedProduct(userId, email, productId);

  return {
    canReview: true,
    hasExistingReview: false,
    verifiedPurchase: purchase.verified,
  };
}

export async function getExistingUserReview(
  userId: string,
  productId: string
) {
  return getUserReviewForProduct(userId, productId);
}
