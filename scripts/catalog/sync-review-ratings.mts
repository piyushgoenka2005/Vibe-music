/**
 * Sync product.rating / reviewCount in catalog JSON from ProductReviewStats.
 * Also refreshes the Postgres product rows (already updated by seed:reviews).
 */
import fs from "node:fs";
import path from "node:path";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const catalogPaths = [
  path.join(process.cwd(), "src", "data", "catalog", "products.json"),
];

type ProductRow = {
  id: string;
  rating: number;
  reviewCount: number;
  [key: string]: unknown;
};

const stats = await prisma.productReviewStats.findMany({
  select: {
    productId: true,
    averageRating: true,
    totalReviews: true,
  },
});

const byId = new Map(
  stats.map((row) => [
    row.productId,
    {
      rating: row.averageRating,
      reviewCount: row.totalReviews,
    },
  ])
);

let updatedProducts = 0;
for (const filePath of catalogPaths) {
  if (!fs.existsSync(filePath)) continue;
  const products = JSON.parse(fs.readFileSync(filePath, "utf8")) as ProductRow[];
  let changed = 0;
  for (const product of products) {
    const next = byId.get(product.id);
    if (!next) continue;
    if (
      product.rating !== next.rating ||
      product.reviewCount !== next.reviewCount
    ) {
      product.rating = next.rating;
      product.reviewCount = next.reviewCount;
      changed += 1;
    }
  }
  fs.writeFileSync(filePath, `${JSON.stringify(products, null, 2)}\n`, "utf8");
  console.log(`Updated ${changed} products in ${path.relative(process.cwd(), filePath)}`);
  updatedProducts = Math.max(updatedProducts, changed);
}

console.log(
  `Synced ratings for ${byId.size} products with review stats (${updatedProducts} JSON rows changed).`
);

await prisma.$disconnect();
