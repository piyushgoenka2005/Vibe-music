/**
 * Seed PostgreSQL from local JSON catalog files.
 * Usage: npm run seed:catalog
 */
import fs from "node:fs";
import path from "node:path";
import { PrismaClient } from "@prisma/client";
import {
  brandToPrisma,
  categoryToPrisma,
  productToPrisma,
} from "../../src/lib/server/prisma/mappers";
import type { Brand } from "../../src/types/brand";
import type { CatalogProduct } from "../../src/types/catalog";
import type { Category } from "../../src/types/category";

const prisma = new PrismaClient();
const catalogDir = path.join(process.cwd(), "src", "data", "catalog");

function readJson<T>(filename: string): T {
  return JSON.parse(fs.readFileSync(path.join(catalogDir, filename), "utf8")) as T;
}

async function main() {
  const brands = readJson<Brand[]>("brands.json");
  const categories = readJson<Category[]>("categories.json").map((category, index) => ({
    ...category,
    isFeatured: index < 8,
    sortOrder: index,
    productCount: 0,
  }));
  const products = readJson<CatalogProduct[]>("products.json");

  console.log(
    `Seeding ${brands.length} brands, ${categories.length} categories, ${products.length} products...`
  );

  await prisma.$transaction(
    brands.map((brand) =>
      prisma.brand.upsert({
        where: { id: brand.id },
        create: brandToPrisma(brand),
        update: brandToPrisma(brand),
      })
    )
  );

  await prisma.$transaction(
    categories.map((category) =>
      prisma.category.upsert({
        where: { id: category.id },
        create: categoryToPrisma(category),
        update: categoryToPrisma(category),
      })
    )
  );

  const chunkSize = 50;
  for (let i = 0; i < products.length; i += chunkSize) {
    const chunk = products.slice(i, i + chunkSize);
    await prisma.$transaction(
      chunk.map((product) =>
        prisma.product.upsert({
          where: { id: product.id },
          create: productToPrisma(product),
          update: productToPrisma(product),
        })
      )
    );
    console.log(`  products ${Math.min(i + chunkSize, products.length)}/${products.length}`);
  }

  // Seed ProductCategory join rows so category navigation and filtering via FK works reliably
  const categoryMap = new Map(categories.map((c) => [c.id, c]));
  const slugToCat = new Map(categories.map((c) => [c.slug.toLowerCase(), c]));

  for (const product of products) {
    const matchedCategories = new Set<string>();
    if (product.categoryId && categoryMap.has(product.categoryId)) {
      matchedCategories.add(product.categoryId);
    }
    const catBySlug =
      slugToCat.get((product.categorySlug || "").toLowerCase()) ||
      slugToCat.get((product.category || "").toLowerCase());
    if (catBySlug) {
      matchedCategories.add(catBySlug.id);
      if (catBySlug.parentId) matchedCategories.add(catBySlug.parentId);
    }
    const subBySlug = slugToCat.get((product.subcategory || "").toLowerCase());
    if (subBySlug) {
      matchedCategories.add(subBySlug.id);
      if (subBySlug.parentId) matchedCategories.add(subBySlug.parentId);
    }

    for (const catId of matchedCategories) {
      await prisma.productCategory.upsert({
        where: {
          productId_categoryId: {
            productId: product.id,
            categoryId: catId,
          },
        },
        create: {
          productId: product.id,
          categoryId: catId,
          isPrimary: catId === product.categoryId || catId === catBySlug?.id,
          sortOrder: 0,
        },
        update: {
          isPrimary: catId === product.categoryId || catId === catBySlug?.id,
        },
      });
    }
  }

  const [brandCount, categoryCount, productCount, productCategoryCount] = await Promise.all([
    prisma.brand.count(),
    prisma.category.count(),
    prisma.product.count(),
    prisma.productCategory.count(),
  ]);

  console.log(
    `Done. brands=${brandCount} categories=${categoryCount} products=${productCount} productCategories=${productCategoryCount}`
  );
  console.log(
    "Catalog seeded. Restart the dev server (or wait for cache TTL) if homepage products look stale."
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
