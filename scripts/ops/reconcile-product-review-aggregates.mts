/**
 * Reconcile product.rating / product.reviewCount from approved reviews table.
 * Fixes stale catalogue aggregates (e.g. inflated review counts on live PDPs).
 *
 * Usage: npx tsx --env-file=.env scripts/ops/reconcile-product-review-aggregates.mts
 */
import "./register-cli-stubs-side-effect.mts";
import { prisma } from "../../src/lib/db/prisma";
import { recalculateProductReviewStats } from "../../src/lib/server/reviewStatsService";

async function main(): Promise<void> {
  const products = await prisma.product.findMany({ select: { id: true, slug: true } });
  let updated = 0;

  for (const product of products) {
    const before = await prisma.product.findUnique({
      where: { id: product.id },
      select: { reviewCount: true, rating: true },
    });
    const stats = await recalculateProductReviewStats(product.id);
    const afterCount = stats.totalReviews;
    const beforeCount = before?.reviewCount ?? 0;
    if (beforeCount !== afterCount) {
      updated += 1;
      console.log(
        `  ${product.slug}: reviewCount ${beforeCount} → ${afterCount} (avg ${stats.averageRating})`,
      );
    }
  }

  console.log(`\nReconciled ${products.length} product(s); ${updated} aggregate(s) updated.\n`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
