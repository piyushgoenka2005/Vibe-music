/**
 * Replace homepage CMS images still pointing at cdn.postimage.me with approved static assets.
 *
 * Usage: npx tsx --env-file=.env scripts/ops/repair-homepage-postimage.mts
 */
import "./register-cli-stubs-side-effect.mts";
import { HOMEPAGE_APLUS_BANNERS } from "../../src/data/homepageAplusSections";
import { prisma } from "../../src/lib/db/prisma";

const SITE = (process.env.SITE_URL ?? "https://vibemusic.in").replace(/\/$/, "");

function fallbackImageForIndex(index: number): string {
  const banner = HOMEPAGE_APLUS_BANNERS[index % HOMEPAGE_APLUS_BANNERS.length];
  const src = banner.imageSrc;
  if (src.startsWith("http")) return src;
  return `${SITE}${src}`;
}

async function main(): Promise<void> {
  const rows = await prisma.homepageSectionItem.findMany({
    where: {
      OR: [
        { customImage: { contains: "postimage", mode: "insensitive" } },
        { customImage: { contains: "postimg.cc", mode: "insensitive" } },
      ],
    },
    orderBy: [{ sectionKey: "asc" }, { sortOrder: "asc" }],
  });

  if (rows.length === 0) {
    console.log("No homepage items on disallowed image hosts.");
    return;
  }

  const now = new Date().toISOString();
  for (const row of rows) {
    const next = fallbackImageForIndex(row.sortOrder);
    await prisma.homepageSectionItem.update({
      where: { id: row.id },
      data: { customImage: next, updatedAt: now },
    });
    console.log(`  ${row.sectionKey}#${row.sortOrder} (${row.id}) → ${next}`);
  }

  console.log(`Updated ${rows.length} homepage item(s).`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
