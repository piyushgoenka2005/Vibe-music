import "server-only";

import { prisma } from "@/lib/db/prisma";
import { invalidateCatalogCache } from "@/lib/server/storeCatalogRepository";
import * as pgContent from "@/lib/server/prisma/contentRepository";
import { prismaToReview } from "@/lib/server/prisma/mappers";
import type { ProductReviewStats } from "@/types/review";

function emptyDistribution(): ProductReviewStats["distribution"] {
  return { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0 };
}

export function emptyProductReviewStats(productId: string): ProductReviewStats {
  return {
    productId,
    totalReviews: 0,
    averageRating: 0,
    distribution: emptyDistribution(),
    verifiedCount: 0,
    withImagesCount: 0,
    lastReviewAt: null,
    updatedAt: new Date().toISOString(),
  };
}

export function buildStatsFromReviews(
  productId: string,
  reviews: Array<{ rating: number; verifiedPurchase?: boolean; hasImages?: boolean; createdAt: string }>
): ProductReviewStats {
  const distribution = emptyDistribution();
  let verifiedCount = 0;
  let withImagesCount = 0;
  let lastReviewAt: string | null = null;

  for (const review of reviews) {
    const bucket = String(review.rating) as keyof ProductReviewStats["distribution"];
    if (bucket in distribution) {
      distribution[bucket] += 1;
    }
    if (review.verifiedPurchase) verifiedCount += 1;
    if (review.hasImages) withImagesCount += 1;
    if (!lastReviewAt || review.createdAt > lastReviewAt) {
      lastReviewAt = review.createdAt;
    }
  }

  const totalReviews = reviews.length;
  const averageRating =
    totalReviews > 0
      ? Math.round(
          (reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews) * 10
        ) / 10
      : 0;

  return {
    productId,
    totalReviews,
    averageRating,
    distribution,
    verifiedCount,
    withImagesCount,
    lastReviewAt,
    updatedAt: new Date().toISOString(),
  };
}

export async function getProductReviewStats(
  productId: string
): Promise<ProductReviewStats> {
  const stats = await pgContent.getProductReviewStats(productId);
  if (!stats) {
    return emptyProductReviewStats(productId);
  }

  return {
    productId: stats.productId,
    totalReviews: Math.max(0, Math.floor(Number(stats.totalReviews) || 0)),
    averageRating: Number(stats.averageRating) || 0,
    distribution: {
      "1": Number((stats.distribution as Record<string, number>)["1"] ?? 0),
      "2": Number((stats.distribution as Record<string, number>)["2"] ?? 0),
      "3": Number((stats.distribution as Record<string, number>)["3"] ?? 0),
      "4": Number((stats.distribution as Record<string, number>)["4"] ?? 0),
      "5": Number((stats.distribution as Record<string, number>)["5"] ?? 0),
    },
    verifiedCount: stats.verifiedCount,
    withImagesCount: stats.withImagesCount,
    lastReviewAt: stats.lastReviewAt,
    updatedAt: stats.updatedAt,
  };
}

export async function recalculateProductReviewStats(
  productId: string
): Promise<ProductReviewStats> {
  const rows = await prisma.review.findMany({
    where: { productId, status: "approved" },
  });

  const reviews = rows.map((row) => {
    const review = prismaToReview(row);
    return {
      rating: review.rating,
      verifiedPurchase: review.verifiedPurchase,
      hasImages: review.hasImages,
      createdAt: review.createdAt,
    };
  });

  const stats = buildStatsFromReviews(productId, reviews);

  await pgContent.upsertProductReviewStatsRecord(stats);
  await pgContent.updateProductReviewAggregates(
    productId,
    stats.averageRating,
    stats.totalReviews
  );
  invalidateCatalogCache();

  return stats;
}
