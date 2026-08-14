/**
 * Publish / refresh the Independence Day hero banner at priority 0 (production VPS).
 *
 * Usage:
 *   npx tsx --env-file=.env scripts/ops/publish-independence-banner.mts
 */
import { PrismaClient } from "@prisma/client";

const BANNER_ID = "00000000-2026-0815-8000-000000000001";
const IMAGE = "/independence-day-special.png";

const prisma = new PrismaClient();

async function main(): Promise<void> {
  const timestamp = new Date().toISOString();

  const existing = await prisma.banner.findMany({ orderBy: { priority: "asc" } });
  const alreadyFirst = existing[0]?.id === BANNER_ID;

  if (!alreadyFirst) {
    for (const banner of existing) {
      if (banner.id === BANNER_ID) continue;
      await prisma.banner.update({
        where: { id: banner.id },
        data: { priority: banner.priority + 1, updatedAt: timestamp },
      });
    }
  }

  await prisma.banner.upsert({
    where: { id: BANNER_ID },
    create: {
      id: BANNER_ID,
      title: "Strings of Freedom",
      subtitle: "Celebrate Independence with Music — 15 August",
      image: IMAGE,
      mobileImage: IMAGE,
      ctaText: "Shop the sale",
      ctaLink: "/deals",
      startDate: "",
      endDate: "",
      priority: 0,
      status: "active",
      createdAt: timestamp,
      updatedAt: timestamp,
    },
    update: {
      title: "Strings of Freedom",
      subtitle: "Celebrate Independence with Music — 15 August",
      image: IMAGE,
      mobileImage: IMAGE,
      ctaText: "Shop the sale",
      ctaLink: "/deals",
      priority: 0,
      status: "active",
      updatedAt: timestamp,
    },
  });

  console.log(`OK  Independence Day hero banner published (${IMAGE})`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
