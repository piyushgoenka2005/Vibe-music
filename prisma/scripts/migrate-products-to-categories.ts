#!/usr/bin/env tsx
/**
 * Migrate existing product category assignments to the new ProductCategory join table.
 *
 * This script:
 * 1. Fetches all categories for lookup
 * 2. Iterates through all products in batches
 * 3. Matches product.categorySlug to category.slug
 * 4. Creates ProductCategory assignments with isPrimary=true
 * 5. Reports migration statistics
 *
 * Run: npx tsx prisma/scripts/migrate-products-to-categories.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function normalizeCategorySlug(slug: string | null | undefined): string {
  if (!slug) return "";
  return slug.toLowerCase().trim().replace(/\s+/g, "-");
}

async function migrateProductsToCategories() {
  console.log("🔄 Starting product-category FK migration...\n");

  const startTime = Date.now();
  let migratedCount = 0;
  let skippedCount = 0;
  let errorCount = 0;
  const errors: Array<{ productSlug: string; reason: string }> = [];

  try {
    // Step 1: Fetch all categories for lookup
    console.log("📚 Loading categories...");
    const categories = await prisma.category.findMany({
      select: { id: true, slug: true, name: true },
    });
    console.log(`✅ Found ${categories.length} categories\n`);

    // Build lookup map: slug -> category
    const categoryMap = new Map(categories.map((c) => [normalizeCategorySlug(c.slug), c]));

    // Step 2: Process products in batches
    console.log("🔍 Processing products...");
    const batchSize = 100;
    let offset = 0;
    let processedTotal = 0;

    let hasMore = true;

    while (hasMore) {
      const products = await prisma.product.findMany({
        select: { id: true, slug: true, categorySlug: true, status: true },
        skip: offset,
        take: batchSize,
        orderBy: { createdAt: "asc" },
      });

      if (products.length === 0) {
        hasMore = false;
        break;
      }

      for (const product of products) {
        try {
          // Normalize slug for matching
          const normalizedSlug = normalizeCategorySlug(product.categorySlug);

          if (!normalizedSlug) {
            console.warn(`  ⏭️  [SKIP] ${product.slug} - No categorySlug`);
            skippedCount++;
            errors.push({ productSlug: product.slug, reason: "No categorySlug" });
            continue;
          }

          // Find matching category
          const matchedCategory = categoryMap.get(normalizedSlug);
          if (!matchedCategory) {
            console.warn(
              `  ⏭️  [SKIP] ${product.slug} - No category found for slug "${normalizedSlug}"`,
            );
            skippedCount++;
            errors.push({
              productSlug: product.slug,
              reason: `No category matched to slug "${normalizedSlug}"`,
            });
            continue;
          }

          // Create or update ProductCategory assignment
          await prisma.productCategory.upsert({
            where: {
              productId_categoryId: {
                productId: product.id,
                categoryId: matchedCategory.id,
              },
            },
            update: {
              isPrimary: true,
            },
            create: {
              productId: product.id,
              categoryId: matchedCategory.id,
              isPrimary: true,
            },
          });

          migratedCount++;
        } catch (error) {
          console.error(
            `  ❌ [ERROR] ${product.slug}:`,
            error instanceof Error ? error.message : String(error),
          );
          errorCount++;
          errors.push({
            productSlug: product.slug,
            reason: error instanceof Error ? error.message : "Unknown error",
          });
        }
      }

      processedTotal += products.length;
      const progress = (
        ((migratedCount + skippedCount + errorCount) / processedTotal) *
        100
      ).toFixed(1);
      console.log(
        `  📊 Batch progress: ${migratedCount} migrated | ${skippedCount} skipped | ${errorCount} errors (${progress}%)`,
      );

      offset += batchSize;
    }

    // Step 3: Summary
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    const totalProcessed = migratedCount + skippedCount + errorCount;

    console.log("\n" + "=".repeat(60));
    console.log("✅ MIGRATION COMPLETE\n");
    console.log(`  Duration: ${duration}s`);
    console.log(`  Total Processed: ${totalProcessed}`);
    console.log(`  ✓ Migrated: ${migratedCount}`);
    console.log(`  ⏭️  Skipped: ${skippedCount}`);
    console.log(`  ❌ Errors: ${errorCount}`);
    console.log("=".repeat(60) + "\n");

    if (errors.length > 0 && errors.length <= 20) {
      console.log("🔍 Error Details:");
      errors.forEach((err) => {
        console.log(`  - ${err.productSlug}: ${err.reason}`);
      });
      console.log();
    }

    if (errorCount > 0) {
      console.log(
        `⚠️  WARNING: ${errorCount} products failed to migrate. Review logs above and retry if needed.\n`,
      );
    } else if (skippedCount > 0) {
      console.log(`ℹ️  INFO: ${skippedCount} products were skipped (no matching category).\n`);
    }

    if (migratedCount > 0) {
      console.log(`🎉 Successfully migrated ${migratedCount} product-category assignments!\n`);
    }
  } catch (error) {
    console.error("\n❌ MIGRATION FAILED:");
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run migration
migrateProductsToCategories();
