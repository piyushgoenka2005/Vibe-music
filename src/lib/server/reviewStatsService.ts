import "server-only";

import { getAdminFirestore } from "@/lib/firebase/admin";
import type { ProductReviewStats } from "@/types/review";

const STATS_COLLECTION = "product_review_stats";
const REVIEWS_COLLECTION = "reviews";
const PRODUCTS_COLLECTION = "products";

function emptyDistribution(): ProductReviewStats["distribution"] {
  return { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0 };
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
  const db = getAdminFirestore();
  const doc = await db.collection(STATS_COLLECTION).doc(productId).get();
  if (doc.exists) {
    const data = doc.data()!;
    const stats: ProductReviewStats = {
      productId,
      totalReviews: Number(data.totalReviews ?? 0),
      averageRating: Number(data.averageRating ?? 0),
      distribution: {
        "1": Number(data.distribution?.["1"] ?? 0),
        "2": Number(data.distribution?.["2"] ?? 0),
        "3": Number(data.distribution?.["3"] ?? 0),
        "4": Number(data.distribution?.["4"] ?? 0),
        "5": Number(data.distribution?.["5"] ?? 0),
      },
      verifiedCount: Number(data.verifiedCount ?? 0),
      withImagesCount: Number(data.withImagesCount ?? 0),
      lastReviewAt: data.lastReviewAt ? String(data.lastReviewAt) : null,
      updatedAt: String(data.updatedAt ?? ""),
    };

    if (stats.totalReviews > 0) return stats;
  }

  const approvedSnap = await db
    .collection(REVIEWS_COLLECTION)
    .where("productId", "==", productId)
    .where("status", "==", "approved")
    .limit(1)
    .get();

  if (!approvedSnap.empty) {
    return recalculateProductReviewStats(productId);
  }

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

export async function recalculateProductReviewStats(
  productId: string
): Promise<ProductReviewStats> {
  const db = getAdminFirestore();
  const snap = await db
    .collection(REVIEWS_COLLECTION)
    .where("productId", "==", productId)
    .where("status", "==", "approved")
    .get();

  const reviews = snap.docs.map((doc) => {
    const data = doc.data();
    return {
      rating: Number(data.rating ?? 0),
      verifiedPurchase: Boolean(data.verifiedPurchase),
      hasImages: Boolean(data.hasImages),
      createdAt: String(data.createdAt ?? ""),
    };
  });

  const stats = buildStatsFromReviews(productId, reviews);

  const batch = db.batch();
  batch.set(db.collection(STATS_COLLECTION).doc(productId), stats, { merge: true });
  batch.update(db.collection(PRODUCTS_COLLECTION).doc(productId), {
    rating: stats.averageRating,
    reviewCount: stats.totalReviews,
    updatedAt: new Date().toISOString(),
  });

  try {
    await batch.commit();
  } catch {
    await db.collection(STATS_COLLECTION).doc(productId).set(stats, { merge: true });
  }

  return stats;
}
