import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function slugify(text) {
  return (text || "")
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function main() {
  console.log("Starting catalog category sync...");

  const [products, categories] = await Promise.all([
    prisma.product.findMany({
      select: {
        id: true,
        sku: true,
        name: true,
        categorySlug: true,
        subcategory: true,
      },
    }),
    prisma.category.findMany({
      select: {
        id: true,
        slug: true,
        name: true,
        parentId: true,
      },
    }),
  ]);

  console.log(`Loaded ${products.length} products and ${categories.length} categories.`);

  // Find root categories
  const rootSlugs = [
    "guitars",
    "studio-recording",
    "drums-percussion",
    "keyboards-synthesizers",
    "live-sound-lighting",
    "microphones-wireless",
    "dj-equipment",
    "cables",
    "accessories",
    "cables-cases-accessories",
    "amplifiers-effects",
    "keyboards-pianos",
    "band-orchestra",
    "bass",
  ];

  const rootCatMap = new Map();
  for (const slug of rootSlugs) {
    const found = categories.find(
      (c) =>
        !c.parentId &&
        (c.slug === slug ||
          c.id === slug ||
          c.id === `cat_${slug}` ||
          c.id === `cat-${slug}`),
    );
    if (found) {
      rootCatMap.set(slug, found);
    }
  }

  // Find categories by slug and name helper
  const findCats = (predicate) => categories.filter(predicate);

  const joinRows = [];

  for (const product of products) {
    const nameLower = product.name.toLowerCase();
    const subLower = (product.subcategory || "").toLowerCase();
    const pCatSlug = product.categorySlug || "";
    const matchedCategoryIds = new Set();

    // 1. Direct parent category
    for (const [slug, root] of rootCatMap.entries()) {
      if (pCatSlug === slug || pCatSlug.includes(slug)) {
        matchedCategoryIds.add(root.id);
      }
    }

    // 2. MIDI Controllers / Keyboards -> belong to BOTH Keyboards and Studio
    if (nameLower.includes("midi") || subLower.includes("midi")) {
      const keys =
        rootCatMap.get("keyboards-synthesizers") ||
        rootCatMap.get("keyboards-pianos");
      const studio = rootCatMap.get("studio-recording");
      if (keys) matchedCategoryIds.add(keys.id);
      if (studio) matchedCategoryIds.add(studio.id);

      // Link to all MIDI child categories
      findCats((c) => c.slug.includes("midi")).forEach((c) => {
        matchedCategoryIds.add(c.id);
        if (c.parentId) matchedCategoryIds.add(c.parentId);
      });
    }

    // 3. Audio Interfaces & Studio Equipment -> Studio & Recording
    if (
      nameLower.includes("interface") ||
      subLower.includes("interface") ||
      subLower.includes("audio equipment") ||
      nameLower.includes("recorder") ||
      subLower.includes("recorder") ||
      nameLower.includes("sampler") ||
      subLower.includes("sampler")
    ) {
      const studio = rootCatMap.get("studio-recording");
      if (studio) matchedCategoryIds.add(studio.id);

      findCats(
        (c) =>
          c.slug.includes("interface") ||
          c.slug.includes("recording") ||
          c.name.toLowerCase().includes("interface"),
      ).forEach((c) => {
        matchedCategoryIds.add(c.id);
        if (c.parentId) matchedCategoryIds.add(c.parentId);
      });
    }

    // 4. Studio Monitors -> Studio & Recording and Live Sound
    if (
      nameLower.includes("monitor") ||
      subLower.includes("monitor") ||
      nameLower.includes("speaker")
    ) {
      const studio = rootCatMap.get("studio-recording");
      const live = rootCatMap.get("live-sound-lighting");
      if (studio) matchedCategoryIds.add(studio.id);
      if (live) matchedCategoryIds.add(live.id);

      findCats((c) => c.slug.includes("monitor")).forEach((c) => {
        matchedCategoryIds.add(c.id);
        if (c.parentId) matchedCategoryIds.add(c.parentId);
      });
    }

    // 5. Audio Mixers -> DJ, Live Sound, Studio & Recording, Amplifiers
    if (nameLower.includes("mixer") || subLower.includes("mixer")) {
      const amps = rootCatMap.get("amplifiers-effects");
      const live = rootCatMap.get("live-sound-lighting");
      const dj = rootCatMap.get("dj-equipment");
      const studio = rootCatMap.get("studio-recording");
      if (amps) matchedCategoryIds.add(amps.id);
      if (live) matchedCategoryIds.add(live.id);
      if (dj) matchedCategoryIds.add(dj.id);
      if (studio) matchedCategoryIds.add(studio.id);

      findCats((c) => c.slug.includes("mixer")).forEach((c) => {
        matchedCategoryIds.add(c.id);
        if (c.parentId) matchedCategoryIds.add(c.parentId);
      });
    }

    // 6. Microphones & Headphones -> Microphones & Wireless and Studio
    if (
      nameLower.includes("microphone") ||
      subLower.includes("microphone") ||
      nameLower.includes("mic")
    ) {
      const mics = rootCatMap.get("microphones-wireless");
      const studio = rootCatMap.get("studio-recording");
      if (mics) matchedCategoryIds.add(mics.id);
      if (studio) matchedCategoryIds.add(studio.id);

      findCats((c) => c.slug.includes("microphone") || c.slug === "mics").forEach(
        (c) => {
          matchedCategoryIds.add(c.id);
          if (c.parentId) matchedCategoryIds.add(c.parentId);
        },
      );
    }

    if (
      nameLower.includes("headphone") ||
      subLower.includes("headphone")
    ) {
      const studio = rootCatMap.get("studio-recording");
      const acc =
        rootCatMap.get("accessories") ||
        rootCatMap.get("cables-cases-accessories");
      if (studio) matchedCategoryIds.add(studio.id);
      if (acc) matchedCategoryIds.add(acc.id);

      findCats((c) => c.slug.includes("headphone")).forEach((c) => {
        matchedCategoryIds.add(c.id);
        if (c.parentId) matchedCategoryIds.add(c.parentId);
      });
    }

    // 7. Cables -> Cables & Accessories
    if (
      pCatSlug === "cables" ||
      nameLower.includes("cable") ||
      subLower.includes("cable")
    ) {
      const cables = rootCatMap.get("cables");
      const acc =
        rootCatMap.get("accessories") ||
        rootCatMap.get("cables-cases-accessories");
      if (cables) matchedCategoryIds.add(cables.id);
      if (acc) matchedCategoryIds.add(acc.id);

      if (
        nameLower.includes("xlr") ||
        subLower.includes("xlr") ||
        nameLower.includes("mic") ||
        subLower.includes("mic")
      ) {
        findCats(
          (c) =>
            c.slug.includes("xlr") ||
            c.slug.includes("microphone-cable") ||
            c.slug.includes("mic-cable"),
        ).forEach((c) => {
          matchedCategoryIds.add(c.id);
          if (c.parentId) matchedCategoryIds.add(c.parentId);
        });
      }

      if (
        nameLower.includes("instrument") ||
        subLower.includes("instrument") ||
        nameLower.includes("guitar cable") ||
        subLower.includes("guitar cable")
      ) {
        findCats(
          (c) =>
            c.slug.includes("instrument-cable") ||
            c.slug.includes("guitar-cable"),
        ).forEach((c) => {
          matchedCategoryIds.add(c.id);
          if (c.parentId) matchedCategoryIds.add(c.parentId);
        });
      }
    }

    // 8. Guitar Amplifiers & Multi-effects -> Guitars & Amplifiers & Effects
    if (
      nameLower.includes("amplifier") ||
      subLower.includes("amplifier") ||
      nameLower.includes("combo amp") ||
      nameLower.includes("multi-effects") ||
      subLower.includes("multi effects")
    ) {
      const amps = rootCatMap.get("amplifiers-effects");
      const guitars = rootCatMap.get("guitars");
      if (amps) matchedCategoryIds.add(amps.id);
      if (guitars) matchedCategoryIds.add(guitars.id);

      findCats(
        (c) =>
          c.slug.includes("amplifier") ||
          c.slug.includes("effects") ||
          c.name.toLowerCase().includes("amplifier"),
      ).forEach((c) => {
        matchedCategoryIds.add(c.id);
        if (c.parentId) matchedCategoryIds.add(c.parentId);
      });
    }

    // 9. Guitars (Acoustic, Electric, Classical)
    if (
      pCatSlug === "guitars" ||
      nameLower.includes("guitar") ||
      subLower.includes("guitar")
    ) {
      const guitars = rootCatMap.get("guitars");
      if (guitars) matchedCategoryIds.add(guitars.id);

      if (
        nameLower.includes("acoustic") ||
        subLower.includes("acoustic") ||
        nameLower.includes("classical") ||
        subLower.includes("classical")
      ) {
        findCats(
          (c) =>
            c.slug.includes("acoustic-guitar") ||
            c.slug.includes("classical-guitar"),
        ).forEach((c) => {
          matchedCategoryIds.add(c.id);
          if (c.parentId) matchedCategoryIds.add(c.parentId);
        });
      }

      if (
        nameLower.includes("electric") ||
        subLower.includes("electric") ||
        nameLower.includes("superstrat")
      ) {
        findCats(
          (c) =>
            c.slug.includes("electric-guitar") ||
            c.slug.includes("superstrat"),
        ).forEach((c) => {
          matchedCategoryIds.add(c.id);
          if (c.parentId) matchedCategoryIds.add(c.parentId);
        });
      }
    }

    // 10. Subcategories matching by name/slug similarity
    const pSubSlug = slugify(product.subcategory);
    for (const cat of categories) {
      if (cat.parentId) {
        const catSlug = slugify(cat.slug);
        const catNameLower = cat.name.toLowerCase();
        if (
          (pSubSlug &&
            (catSlug === pSubSlug ||
              catSlug.endsWith(`-${pSubSlug}`) ||
              pSubSlug.endsWith(`-${catSlug}`))) ||
          (subLower &&
            (catNameLower === subLower ||
              subLower.includes(catNameLower) ||
              catNameLower.includes(subLower)))
        ) {
          matchedCategoryIds.add(cat.id);
          if (cat.parentId) matchedCategoryIds.add(cat.parentId);
        }
      }
    }

    for (const categoryId of matchedCategoryIds) {
      joinRows.push({
        productId: product.id,
        categoryId,
      });
    }
  }

  console.log(`Generated ${joinRows.length} join relationships.`);

  // Insert into productCategories with skipDuplicates
  const result = await prisma.productCategory.createMany({
    data: joinRows,
    skipDuplicates: true,
  });

  console.log(`Inserted ${result.count} new product_category links.`);

  // Now recount and update product_count for all categories
  const currentJoinCounts = await prisma.productCategory.groupBy({
    by: ["categoryId"],
    _count: { productId: true },
  });

  const countByCat = new Map();
  for (const row of currentJoinCounts) {
    countByCat.set(row.categoryId, row._count.productId);
  }

  // Roll up children to parents
  for (const cat of categories) {
    if (cat.parentId) {
      const childCount = countByCat.get(cat.id) || 0;
      const parentCount = countByCat.get(cat.parentId) || 0;
      countByCat.set(cat.parentId, parentCount + childCount);
    }
  }

  let updatedCount = 0;
  for (const cat of categories) {
    const total = countByCat.get(cat.id) || 0;
    if (total > 0 && total !== cat.productCount) {
      await prisma.category.update({
        where: { id: cat.id },
        data: { productCount: total },
      });
      updatedCount++;
    }
  }

  console.log(`Updated product_count for ${updatedCount} categories.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
