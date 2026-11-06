import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const products = await prisma.product.findMany({
    where: { status: "active" },
    select: {
      id: true,
      sku: true,
      name: true,
      categorySlug: true,
      subcategory: true,
    },
  });

  console.log(`Total active products: ${products.length}`);

  const bySubcategory = new Map();
  for (const p of products) {
    const sub = p.subcategory || "(none)";
    bySubcategory.set(sub, (bySubcategory.get(sub) || 0) + 1);
  }

  console.log("\n--- Products By Subcategory ---");
  for (const [sub, count] of Array.from(bySubcategory.entries()).sort((a, b) => b[1] - a[1])) {
    console.log(`${sub}: ${count}`);
  }

  const byCat = new Map();
  for (const p of products) {
    const cat = p.categorySlug || "(none)";
    byCat.set(cat, (byCat.get(cat) || 0) + 1);
  }

  console.log("\n--- Products By Category Slug ---");
  for (const [cat, count] of Array.from(byCat.entries()).sort((a, b) => b[1] - a[1])) {
    console.log(`${cat}: ${count}`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());

