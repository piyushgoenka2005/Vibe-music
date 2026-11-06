import { PrismaClient } from "@prisma/client";
import { resolveRootCategory } from "../../src/lib/categorySlug";

const prisma = new PrismaClient();

async function main() {
  console.log("==> Reconciling product categories in database...");
  const categories = await prisma.category.findMany();
  console.log(`Found ${categories.length} categories in database.`);

  const rootCategories = categories.filter((c) => !c.parentId);
  const rootSlugs = new Set(rootCategories.map((c) => c.slug.toLowerCase()));
  const rootNames = new Set(rootCategories.map((c) => c.name.toLowerCase()));
  const categoryMap = new Map(categories.map((c) => [c.id, c]));
  const slugToCat = new Map(categories.map((c) => [c.slug.toLowerCase(), c]));
  const nameToCat = new Map(categories.map((c) => [c.name.toLowerCase(), c]));

  const products = await prisma.product.findMany();
  console.log(`Analyzing ${products.length} products...`);

  let updatedCount = 0;

  for (const product of products) {
    const isRootSlug = product.categorySlug && rootSlugs.has(product.categorySlug.toLowerCase());
    const isRootName = product.category && rootNames.has(product.category.toLowerCase());

    let targetRoot = isRootSlug && isRootName
      ? rootCategories.find((c) => c.slug.toLowerCase() === product.categorySlug.toLowerCase())
      : undefined;

    if (!targetRoot) {
      targetRoot = resolveRootCategory(categories, {
        categorySlug: product.categorySlug ?? undefined,
        category: product.category ?? undefined,
        subcategory: product.subcategory ?? undefined,
        name: product.name,
      });

      if (targetRoot) {
        const subcategoryToKeep =
          product.subcategory ||
          (product.category && product.category.toLowerCase() !== targetRoot.name.toLowerCase()
            ? product.category
            : "");

        await prisma.product.update({
          where: { id: product.id },
          data: {
            category: targetRoot.name,
            categorySlug: targetRoot.slug,
            subcategory: subcategoryToKeep,
          },
        });

        console.log(
          `  [Updated] ${product.sku || product.id} (${product.name.slice(0, 40)}...): ` +
            `category "${product.category}" (${product.categorySlug}) -> "${targetRoot.name}" (${targetRoot.slug}), subcategory "${subcategoryToKeep}"`
        );
        updatedCount += 1;
      } else {
        console.warn(`  [Warning] Could not resolve root category for product: ${product.sku} - ${product.name}`);
      }
    }

    // Ensure ProductCategory join rows exist
    const matchedCategoryIds = new Set<string>();
    if (targetRoot) {
      matchedCategoryIds.add(targetRoot.id);
    }

    // Match subcategory if present
    const sub = product.subcategory;
    if (sub) {
      const subCat = nameToCat.get(sub.toLowerCase()) || slugToCat.get(sub.toLowerCase());
      if (subCat) {
        matchedCategoryIds.add(subCat.id);
        if (subCat.parentId) matchedCategoryIds.add(subCat.parentId);
      }
    }

    // Match original category row if it was a child
    if (product.category) {
      const origCat = nameToCat.get(product.category.toLowerCase()) || slugToCat.get(product.category.toLowerCase());
      if (origCat) {
        matchedCategoryIds.add(origCat.id);
        if (origCat.parentId) matchedCategoryIds.add(origCat.parentId);
      }
    }

    for (const catId of matchedCategoryIds) {
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
          isPrimary: targetRoot ? catId === targetRoot.id : false,
        },
        update: {
          isPrimary: targetRoot ? catId === targetRoot.id : false,
        },
      });
    }
  }

  console.log(`==> Finished reconciling product categories. Updated ${updatedCount} products.`);
}

main()
  .catch((err) => {
    console.error("Failed to reconcile product categories:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
