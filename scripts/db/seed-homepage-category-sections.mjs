/**
 * Ensure new homepage category CMS sections exist and are seeded.
 * Run: node --env-file .env.local scripts/db/seed-homepage-category-sections.mjs
 */
import { PrismaClient } from "@prisma/client";
import { POPULAR_CATEGORY_ITEMS } from "../../src/data/popularCategories.ts";
import { BROWSE_CATEGORY_CARDS } from "../../src/data/browseCategoryCards.ts";
import { CATEGORY_BENTO_ITEMS } from "../../src/data/categoryBento.ts";

const prisma = new PrismaClient();
const now = new Date().toISOString();

function packOffer(desc, brands) {
  const d = (desc ?? "").trim();
  const b = (brands ?? "").trim();
  if (!d && !b) return null;
  if (!b) return d;
  if (!d) return `\n${b}`;
  return `${d}\n${b}`;
}

async function ensureSection(section) {
  await prisma.homepageSection.upsert({
    where: { sectionKey: section.sectionKey },
    create: {
      id: section.sectionKey,
      ...section,
      createdAt: now,
      updatedAt: now,
    },
    update: {
      title: section.title,
      ctaText: section.ctaText,
      ctaLink: section.ctaLink,
      accentLabel: section.accentLabel ?? null,
      sourceMode: section.sourceMode,
      maxItems: section.maxItems,
      layout: section.layout,
      sortOrder: section.sortOrder,
      updatedAt: now,
    },
  });
}

async function seedItemsIfEmpty(sectionKey, items) {
  const count = await prisma.homepageSectionItem.count({ where: { sectionKey } });
  if (count > 0) {
    console.log(`${sectionKey}: already has ${count} items — skip seed`);
    return;
  }
  await prisma.homepageSectionItem.createMany({ data: items });
  console.log(`${sectionKey}: seeded ${items.length} items`);
}

await ensureSection({
  sectionKey: "featured_categories",
  title: "Popular Categories",
  ctaText: "Browse All Categories",
  ctaLink: "/categories",
  isActive: true,
  sortOrder: 4,
  sourceMode: "manual",
  maxItems: 12,
  layout: "category_grid",
});

await ensureSection({
  sectionKey: "browse_by_categories",
  title: "Browse by Categories",
  ctaText: "View All Gear",
  ctaLink: "/categories",
  isActive: true,
  sortOrder: 5,
  sourceMode: "manual",
  maxItems: 12,
  layout: "browse_category_cards",
});

await ensureSection({
  sectionKey: "category_bento",
  title: "Shop by Category",
  accentLabel: "Explore Category",
  ctaText: "Browse all categories",
  ctaLink: "/categories",
  isActive: true,
  sortOrder: 6,
  sourceMode: "manual",
  maxItems: 12,
  layout: "category_bento",
});

await seedItemsIfEmpty(
  "featured_categories",
  POPULAR_CATEGORY_ITEMS.map((item, index) => {
    const slug = item.href.split("/").filter(Boolean).pop() ?? `category-${item.slot}`;
    return {
      id: `popular-cat-${item.slot}`,
      sectionKey: "featured_categories",
      sortOrder: index,
      isActive: true,
      categorySlug: slug,
      customTitle: item.title,
      customImage: item.imageSrc,
      customHref: item.href,
      badgeLabel: item.badge ?? null,
      createdAt: now,
      updatedAt: now,
    };
  }),
);

await seedItemsIfEmpty(
  "browse_by_categories",
  BROWSE_CATEGORY_CARDS.map((card, index) => ({
    id: `browse-cat-${card.id}`,
    sectionKey: "browse_by_categories",
    sortOrder: index,
    isActive: true,
    categorySlug: card.id,
    customTitle: card.title,
    customImage: card.image,
    customHref: card.href,
    createdAt: now,
    updatedAt: now,
  })),
);

await seedItemsIfEmpty(
  "category_bento",
  CATEGORY_BENTO_ITEMS.map((item, index) => ({
    id: `bento-cat-${item.slug}`,
    sectionKey: "category_bento",
    sortOrder: index,
    isActive: true,
    categorySlug: item.slug,
    customTitle: item.title,
    customImage: item.image,
    customHref: `/category/${item.slug}`,
    badgeLabel: item.badge ?? null,
    offerText: packOffer(item.desc, item.brands),
    createdAt: now,
    updatedAt: now,
  })),
);

console.log("Done.");
await prisma.$disconnect();
