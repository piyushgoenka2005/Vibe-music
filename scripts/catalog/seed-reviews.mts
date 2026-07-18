/**
 * Seed approved synthetic Indian product reviews into PostgreSQL.
 * Usage: npm run seed:reviews
 *
 * Expects src/data/catalog/synthetic-reviews.json
 * (generate first with: npm run generate:reviews)
 */
import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { PrismaClient } from "@prisma/client";
import { syntheticReviewCreatedAt } from "../../src/lib/reviews/syntheticReviewDate.ts";

const prisma = new PrismaClient();
const catalogDir = path.join(process.cwd(), "src", "data", "catalog");
const BATCH_SIZE = 250;

interface SyntheticReview {
  productSku: string;
  productSlug?: string;
  name: string;
  city: string;
  state?: string;
  rating: number;
  review: string;
  date: string;
  synthetic?: boolean;
  verifiedPurchase?: boolean;
  kind?: "written" | "rating";
}

interface CatalogProduct {
  id: string;
  sku: string;
  slug: string;
  name: string;
}

function readJson<T>(filename: string): T {
  return JSON.parse(fs.readFileSync(path.join(catalogDir, filename), "utf8")) as T;
}

function reviewId(
  productSlug: string,
  date: string,
  name: string,
  rating: number,
  index: number,
  kind: string
): string {
  const digest = createHash("sha1")
    .update(`${productSlug}|${date}|${name}|${rating}|${index}|${kind}`)
    .digest("hex")
    .slice(0, 16);
  return `synth-review-${digest}`;
}

function titleFromEntry(entry: SyntheticReview): string {
  if (entry.kind === "rating") {
    if (entry.rating >= 5) return "5 star rating";
    if (entry.rating === 4) return "4 star rating";
    if (entry.rating === 3) return "3 star rating";
    if (entry.rating === 2) return "2 star rating";
    return "1 star rating";
  }
  if (entry.rating >= 5) return "Excellent product";
  if (entry.rating === 4) return "Good value, solid performance";
  if (entry.rating === 3) return "Okay for the price";
  if (entry.rating === 2) return "Average experience";
  return "Needs improvement";
}

function emptyDistribution() {
  return { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0 };
}

async function recalculateStats(productId: string) {
  const rows = await prisma.review.findMany({
    where: { productId, status: "approved" },
    select: {
      rating: true,
      verifiedPurchase: true,
      hasImages: true,
      createdAt: true,
    },
  });

  const distribution = emptyDistribution();
  let verifiedCount = 0;
  let withImagesCount = 0;
  let lastReviewAt: string | null = null;
  let sum = 0;

  for (const row of rows) {
    const key = String(row.rating) as keyof typeof distribution;
    if (key in distribution) distribution[key] += 1;
    if (row.verifiedPurchase) verifiedCount += 1;
    if (row.hasImages) withImagesCount += 1;
    if (!lastReviewAt || row.createdAt > lastReviewAt) lastReviewAt = row.createdAt;
    sum += row.rating;
  }

  const totalReviews = rows.length;
  const averageRating =
    totalReviews > 0 ? Math.round((sum / totalReviews) * 10) / 10 : 0;
  const updatedAt = new Date().toISOString();

  await prisma.productReviewStats.upsert({
    where: { productId },
    create: {
      productId,
      totalReviews,
      averageRating,
      distribution,
      verifiedCount,
      withImagesCount,
      lastReviewAt,
      updatedAt,
    },
    update: {
      totalReviews,
      averageRating,
      distribution,
      verifiedCount,
      withImagesCount,
      lastReviewAt,
      updatedAt,
    },
  });

  await prisma.product.update({
    where: { id: productId },
    data: {
      rating: averageRating,
      reviewCount: totalReviews,
    },
  });
}

async function main() {
  const reviewsPath = path.join(catalogDir, "synthetic-reviews.json");
  if (!fs.existsSync(reviewsPath)) {
    throw new Error(
      "Missing synthetic-reviews.json. Run: npm run generate:reviews"
    );
  }

  const products = readJson<CatalogProduct[]>("products.json");
  const synthetic = readJson<SyntheticReview[]>("synthetic-reviews.json");

  const bySlug = new Map(products.map((p) => [p.slug, p]));
  const bySku = new Map<string, CatalogProduct[]>();
  for (const product of products) {
    const list = bySku.get(product.sku) ?? [];
    list.push(product);
    bySku.set(product.sku, list);
  }

  const deleted = await prisma.review.deleteMany({
    where: { userId: { startsWith: "synthetic:" } },
  });
  console.log(`Cleared ${deleted.count} existing synthetic reviews`);

  console.log(`Preparing ${synthetic.length} synthetic reviews...`);

  const rows: Array<{
    id: string;
    productId: string;
    productName: string;
    productSlug: string;
    userId: string;
    userEmail: null;
    author: string;
    rating: number;
    title: string;
    body: string;
    images: string[];
    hasImages: boolean;
    verifiedPurchase: boolean;
    orderId: null;
    status: string;
    adminReply: null;
    rejectionReason: null;
    helpfulCount: number;
    createdAt: string;
    updatedAt: string;
  }> = [];

  let unresolved = 0;
  const touchedProducts = new Set<string>();
  const perSlugIndex = new Map<string, number>();

  for (const entry of synthetic) {
    let product =
      (entry.productSlug ? bySlug.get(entry.productSlug) : undefined) ??
      undefined;

    if (!product) {
      const matches = bySku.get(entry.productSku) ?? [];
      product = matches.length === 1 ? matches[0] : undefined;
    }

    if (!product) {
      unresolved += 1;
      continue;
    }

    const index = perSlugIndex.get(product.slug) ?? 0;
    perSlugIndex.set(product.slug, index + 1);

    const kind = entry.kind ?? "written";
    const id = reviewId(
      product.slug,
      entry.date,
      entry.name,
      entry.rating,
      index,
      kind
    );
    // Persist a rolling last-3-years date (stable per review id).
    const createdAt = syntheticReviewCreatedAt(id);

    const location = entry.state
      ? `${entry.city}, ${entry.state}`
      : entry.city;
    const author = `${entry.name} - ${location}`;

    rows.push({
      id,
      productId: product.id,
      productName: product.name,
      productSlug: product.slug,
      userId: `synthetic:${id}`,
      userEmail: null,
      author,
      rating: entry.rating,
      title: titleFromEntry(entry),
      body: entry.review.trim(),
      images: [],
      hasImages: false,
      verifiedPurchase: entry.verifiedPurchase ?? true,
      orderId: null,
      status: "approved",
      adminReply: null,
      rejectionReason: null,
      helpfulCount:
        kind === "written" ? Math.floor((index * 3) % 17) : Math.floor(index % 5),
      createdAt,
      updatedAt: createdAt,
    });
    touchedProducts.add(product.id);
  }

  console.log(`Inserting ${rows.length} reviews in batches of ${BATCH_SIZE}...`);
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const chunk = rows.slice(i, i + BATCH_SIZE);
    await prisma.review.createMany({ data: chunk, skipDuplicates: true });
    if ((i / BATCH_SIZE) % 8 === 0 || i + BATCH_SIZE >= rows.length) {
      console.log(`  ${Math.min(i + BATCH_SIZE, rows.length)}/${rows.length}`);
    }
  }

  console.log(`Recalculating stats for ${touchedProducts.size} products...`);
  let done = 0;
  for (const productId of touchedProducts) {
    await recalculateStats(productId);
    done += 1;
    if (done % 10 === 0 || done === touchedProducts.size) {
      console.log(`  stats ${done}/${touchedProducts.size}`);
    }
  }

  console.log(`Done. inserted=${rows.length} unresolved=${unresolved}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
