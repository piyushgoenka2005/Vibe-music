import "server-only";

import { randomUUID } from "crypto";
import { prisma } from "@/lib/db/prisma";

export const REVIEW_VOTES_COLLECTION = "reviewVotes";

export async function hasUserVotedReview(
  reviewId: string,
  userId: string
): Promise<boolean> {
  const vote = await prisma.reviewVote.findUnique({
    where: { reviewId_userId: { reviewId, userId } },
  });
  return Boolean(vote);
}

export async function voteReviewHelpful(
  reviewId: string,
  userId: string
): Promise<{ helpfulCount: number }> {
  const review = await prisma.review.findUnique({ where: { id: reviewId } });
  if (!review || review.status !== "approved") {
    throw new Error("Review not found");
  }

  const existing = await prisma.reviewVote.findUnique({
    where: { reviewId_userId: { reviewId, userId } },
  });
  if (existing) {
    throw new Error("You have already marked this review as helpful");
  }

  const now = new Date().toISOString();
  const updated = await prisma.$transaction(async (tx) => {
    await tx.reviewVote.create({
      data: {
        id: randomUUID(),
        reviewId,
        userId,
        createdAt: now,
      },
    });
    return tx.review.update({
      where: { id: reviewId },
      data: {
        helpfulCount: { increment: 1 },
        updatedAt: now,
      },
    });
  });

  return { helpfulCount: updated.helpfulCount };
}

export async function getUserVotesForReviews(
  reviewIds: string[],
  userId: string
): Promise<Set<string>> {
  if (reviewIds.length === 0) return new Set();
  const votes = await prisma.reviewVote.findMany({
    where: { userId, reviewId: { in: reviewIds } },
    select: { reviewId: true },
  });
  return new Set(votes.map((vote) => vote.reviewId));
}

export async function deleteVotesForReview(reviewId: string): Promise<number> {
  const result = await prisma.reviewVote.deleteMany({ where: { reviewId } });
  return result.count;
}
