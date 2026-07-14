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

  const [brandCount, categoryCount, productCount] = await Promise.all([
    prisma.brand.count(),
    prisma.category.count(),
    prisma.product.count(),
  ]);

  console.log(`Done. brands=${brandCount} categories=${categoryCount} products=${productCount}`);
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
