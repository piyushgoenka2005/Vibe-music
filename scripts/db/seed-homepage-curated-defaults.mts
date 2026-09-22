/**
 * Backfill empty curated homepage CMS items (stories, brands).
 * Run: npx tsx --env-file=.env.local scripts/db/seed-homepage-curated-defaults.mts
 */
import { PrismaClient } from "@prisma/client";
import { HOMEPAGE_APLUS_BANNERS } from "../../src/data/homepageAplusSections";
import { TOP_BRAND_STRIP_SLUGS } from "../../src/data/topBrandStrip";
import { getBrandLogoUrl } from "../../src/lib/brandLogos";

const prisma = new PrismaClient();
const now = new Date().toISOString();

async function empty(sectionKey: string) {
  return (await prisma.homepageSectionItem.count({ where: { sectionKey } })) === 0;
}

if (await empty("featured_stories")) {
  await prisma.homepageSectionItem.createMany({
    data: HOMEPAGE_APLUS_BANNERS.map((banner, index) => ({
      id: banner.id,
      sectionKey: "featured_stories",
      sortOrder: index,
      isActive: true,
      customImage: banner.imageSrc,
      customTitle: banner.imageAlt,
      customHref: banner.href ?? null,
      createdAt: now,
      updatedAt: now,
    })),
    skipDuplicates: true,
  });
  console.log(`featured_stories: seeded ${HOMEPAGE_APLUS_BANNERS.length}`);
} else {
  console.log("featured_stories: already seeded");
}

if (await empty("brand_strip")) {
  let brands = await prisma.brand.findMany({
    where: { slug: { in: [...TOP_BRAND_STRIP_SLUGS] } },
    select: { id: true, slug: true, name: true },
  });
  if (brands.length === 0) {
    brands = await prisma.brand.findMany({
      take: 16,
      orderBy: { name: "asc" },
      select: { id: true, slug: true, name: true },
    });
  }
  const bySlug = new Map(brands.map((b) => [b.slug, b]));
  const preferred = TOP_BRAND_STRIP_SLUGS.map((slug) => bySlug.get(slug)).filter(
    (b): b is NonNullable<typeof b> => Boolean(b),
  );
  const ordered = preferred.length > 0 ? preferred : brands;
  const rows = ordered.map((brand, index) => {
    const logoUrl = getBrandLogoUrl(brand.slug);
    return {
      id: `brand-strip-${brand.slug}`,
      sectionKey: "brand_strip",
      sortOrder: index,
      isActive: true,
      brandId: brand.id,
      customTitle: brand.name,
      customImage: logoUrl || null,
      customHref: `/search/results?brand=${encodeURIComponent(brand.slug)}`,
      createdAt: now,
      updatedAt: now,
    };
  });
  if (rows.length > 0) {
    await prisma.homepageSectionItem.createMany({ data: rows, skipDuplicates: true });
    await prisma.homepageSection.updateMany({
      where: { sectionKey: "brand_strip" },
      data: { sourceMode: "manual", updatedAt: now },
    });
    console.log(`brand_strip: seeded ${rows.length}`);
  } else {
    console.log("brand_strip: no brands in DB to seed");
  }
} else {
  console.log("brand_strip: already seeded");
  await prisma.homepageSection.updateMany({
    where: { sectionKey: "brand_strip" },
    data: { sourceMode: "manual", updatedAt: now },
  });
}

const counts = await prisma.homepageSectionItem.groupBy({
  by: ["sectionKey"],
  _count: true,
});
console.log("item counts:", counts);

await prisma.$disconnect();
