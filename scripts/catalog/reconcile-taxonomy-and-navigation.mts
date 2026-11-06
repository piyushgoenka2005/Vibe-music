import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const SUBCATEGORY_CANONICAL_MAP: Record<string, string> = {
  "Acoustic Guitar": "Acoustic Guitars",
  "Guitar": "Acoustic Guitars",
  "Electric Guitar": "Electric Guitars",
  "Electro Acoustic Guitar": "Electro-Acoustic Guitars",
  "GUITAR AMPLIFIER": "Guitar Amplifiers",
  "Cymbal": "Cymbals",
  "Music Stand": "Music Stands",
  "Keyboard Stand": "Keyboard Stands",
  "Microphone Stand": "Microphone Stands",
};

async function main() {
  console.log("==> Starting Taxonomy, Product & Navigation Reconciliation...");

  // 1. Reconcile Main Navigation: Keyboards & Synthesizers
  const navUpdate = await prisma.navigationMenuItem.updateMany({
    where: {
      menu: { handle: "main_nav" },
      label: { contains: "KEYBOARDS", mode: "insensitive" },
    },
    data: {
      url: "/category/keyboards-synthesizers",
      categoryId: "keyboards-synthesizers",
    },
  });
  console.log(`[Navigation] Updated ${navUpdate.count} keyboard navigation item(s) to /category/keyboards-synthesizers`);

  // 2. Reconcile single orphan keyboard product
  const kbProductUpdate = await prisma.product.updateMany({
    where: {
      categorySlug: "keyboards-pianos",
    },
    data: {
      category: "Keyboards & Synthesizers",
      categorySlug: "keyboards-synthesizers",
    },
  });
  console.log(`[Products] Migrated ${kbProductUpdate.count} product(s) from keyboards-pianos to keyboards-synthesizers`);

  // 3. Fix misclassified guitar cable
  const cableFix = await prisma.product.updateMany({
    where: {
      id: "prod-4a126dfc-bf4a-4ecd-ba4a-507284cc41ad",
    },
    data: {
      subcategory: "Guitar & Instrument Cables",
    },
  });
  console.log(`[Products] Reclassified misclassified guitar cable: ${cableFix.count}`);

  // 4. Normalize singular/fragmented subcategories in Product table
  for (const [from, to] of Object.entries(SUBCATEGORY_CANONICAL_MAP)) {
    const res = await prisma.product.updateMany({
      where: { subcategory: from },
      data: { subcategory: to },
    });
    if (res.count > 0) {
      console.log(`[Products] Normalized subcategory "${from}" -> "${to}" (${res.count} products)`);
    }
  }

  // 5. Reconcile ProductCategory joins
  console.log("[ProductCategory] Re-syncing product categories join table...");
  const categories = await prisma.category.findMany();
  const catBySlug = new Map(categories.map((c) => [c.slug.toLowerCase(), c]));
  const catByName = new Map(categories.map((c) => [c.name.toLowerCase(), c]));

  const products = await prisma.product.findMany({
    select: { id: true, categorySlug: true, category: true, subcategory: true },
  });

  let joinCount = 0;
  for (const p of products) {
    const targetCatIds = new Set<string>();

    const rootCat =
      (p.categorySlug ? catBySlug.get(p.categorySlug.toLowerCase()) : undefined) ??
      (p.category ? catByName.get(p.category.toLowerCase()) : undefined);

    if (rootCat) {
      targetCatIds.add(rootCat.id);
    }

    if (p.subcategory) {
      const subCat =
        catByName.get(p.subcategory.toLowerCase()) ??
        catBySlug.get(p.subcategory.toLowerCase().replace(/[\s&/]+/g, "-"));
      if (subCat) {
        targetCatIds.add(subCat.id);
        if (subCat.parentId) targetCatIds.add(subCat.parentId);
      }
    }

    for (const catId of targetCatIds) {
      await prisma.productCategory.upsert({
        where: {
          productId_categoryId: {
            productId: p.id,
            categoryId: catId,
          },
        },
        create: {
          productId: p.id,
          categoryId: catId,
          isPrimary: rootCat ? catId === rootCat.id : false,
        },
        update: {
          isPrimary: rootCat ? catId === rootCat.id : false,
        },
      });
      joinCount += 1;
    }
  }

  console.log(`[ProductCategory] Reconciled ${joinCount} product-category links.`);
  console.log("==> Taxonomy, Product & Navigation Reconciliation Complete!");
}

main()
  .catch((e) => {
    console.error("Error during reconciliation:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

