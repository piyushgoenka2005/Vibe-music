/**
 * Seed production ops content: store phone + admin banners (if empty).
 * Usage: npx tsx --env-file=.env scripts/ops/seed-production-ops.mts
 */
import { PrismaClient } from "@prisma/client";
import { randomUUID } from "node:crypto";

const prisma = new PrismaClient();

const DEFAULT_BANNERS = [
  {
    title: "Strings of Freedom",
    subtitle: "Celebrate Independence with Music — 15 August",
    image: "/independence-day-special.png",
    mobileImage: "/independence-day-special.png",
    ctaText: "Shop the sale",
    ctaLink: "/deals",
  },
  {
    title: "",
    subtitle: "",
    image: "/hertz-hg-20.webp",
    mobileImage: "/hertz-hg-20.webp",
    ctaText: "",
    ctaLink: "/search/results?brand=hertz",
  },
  {
    title: "",
    subtitle: "",
    image: "/electrix-guitar.webp",
    mobileImage: "/electrix-guitar.webp",
    ctaText: "",
    ctaLink: "/category/guitars",
  },
  {
    title: "",
    subtitle: "",
    image: "/images/banner-5.jpeg",
    mobileImage: "/images/banner-5.jpeg",
    ctaText: "",
    ctaLink: "/search/results?brand=zoom",
  },
] as const;

function resolveStorePhone(): string {
  return (
    process.env.NEXT_PUBLIC_STORE_PHONE?.trim() ||
    process.env.STORE_PHONE?.trim() ||
    "919773651006"
  );
}

async function seedStorePhone(): Promise<void> {
  const phone = resolveStorePhone();
  if (!phone) {
    console.log("SKIP store phone — set NEXT_PUBLIC_STORE_PHONE in .env");
    return;
  }

  const existing = await prisma.storeSettings.findUnique({ where: { id: "store" } });
  const timestamp = new Date().toISOString();

  if (existing?.storePhone?.trim()) {
    console.log(`OK  store phone already set (${existing.storePhone})`);
    return;
  }

  await prisma.storeSettings.upsert({
    where: { id: "store" },
    create: {
      id: "store",
      storeName: "Vibe Music",
      storeEmail: "support@vibemusic.in",
      storePhone: phone,
      storeAddress: "Sikkim Commerce House, 4/1 Middleton Street, 3rd Floor, Room 303, Kolkata – 700071",
      gstNumber: "",
      defaultGstRate: 18,
      sellerState: "Maharashtra",
      freeShippingThreshold: 0,
      standardShippingCharge: 0,
      razorpayEnabled: true,
      updatedAt: timestamp,
    },
    update: {
      storePhone: phone,
      updatedAt: timestamp,
    },
  });
  console.log(`OK  store phone set from env`);
}

async function seedBanners(): Promise<void> {
  const count = await prisma.banner.count();
  const timestamp = new Date().toISOString();

  if (count > 0) {
    console.log(`OK  banners already exist (${count}) — syncing optional copy`);
    // Clear overlapping text overlay from graphical banners where graphic already has text baked in
    for (const banner of DEFAULT_BANNERS) {
      if (banner.title === "") {
        await prisma.banner.updateMany({
          where: {
            image: banner.image,
            OR: [
              { title: { in: ["Hertz HG 20", "Electric guitars", "Zoom MultiStomp"] } },
              { ctaText: { in: ["Shop Hertz", "Browse guitars", "Shop Zoom"] } },
            ],
          },
          data: {
            title: "",
            subtitle: null,
            ctaText: "",
            updatedAt: timestamp,
          },
        });
      }
    }
    return;
  }

  for (const [index, banner] of DEFAULT_BANNERS.entries()) {
    await prisma.banner.create({
      data: {
        id: randomUUID(),
        title: banner.title,
        subtitle: banner.subtitle,
        image: banner.image,
        mobileImage: banner.mobileImage,
        ctaText: banner.ctaText,
        ctaLink: banner.ctaLink,
        startDate: "",
        endDate: "",
        priority: index,
        status: "active",
        createdAt: timestamp,
        updatedAt: timestamp,
      },
    });
    console.log(`OK  banner: ${banner.title}`);
  }
}

async function main() {
  await seedStorePhone();
  await seedBanners();
  console.log("\nProduction ops seed complete.\n");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
