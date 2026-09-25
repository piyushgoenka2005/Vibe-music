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

function resolveLegalName(): string {
  return process.env.NEXT_PUBLIC_LEGAL_ENTITY_NAME?.trim() || "Vibe Music";
}

function resolveGstin(): string {
  return process.env.NEXT_PUBLIC_GSTIN?.trim() || "";
}

async function seedStoreSettings(): Promise<void> {
  const phone = resolveStorePhone();
  const legalName = resolveLegalName();
  const gstin = resolveGstin();
  const timestamp = new Date().toISOString();

  const existing = await prisma.storeSettings.findUnique({ where: { id: "store" } });

  const updateData: Record<string, string | number | boolean> = {
    updatedAt: timestamp,
  };
  if (phone && !existing?.storePhone?.trim()) {
    updateData.storePhone = phone;
  }
  if (legalName && (!existing?.storeName?.trim() || existing.storeName === "Vibe Music")) {
    updateData.storeName = legalName;
  }
  if (gstin && !existing?.gstNumber?.trim()) {
    updateData.gstNumber = gstin;
  }

  if (existing) {
    if (Object.keys(updateData).length > 1) {
      await prisma.storeSettings.update({
        where: { id: "store" },
        data: updateData,
      });
      console.log("OK  store settings synced from env (phone/legal/GSTIN)");
    } else {
      console.log(`OK  store settings unchanged (phone=${existing.storePhone || "unset"})`);
    }
    return;
  }

  if (!phone) {
    console.log("SKIP store settings — set NEXT_PUBLIC_STORE_PHONE in .env");
    return;
  }

  await prisma.storeSettings.create({
    data: {
      id: "store",
      storeName: legalName,
      storeEmail: "support@vibemusic.in",
      storePhone: phone,
      storeAddress:
        "Sikkim Commerce House, 4/1 Middleton Street, 3rd Floor, Room 303, Kolkata – 700071",
      gstNumber: gstin,
      defaultGstRate: 18,
      sellerState: "West Bengal",
      freeShippingThreshold: 0,
      standardShippingCharge: 0,
      razorpayEnabled: true,
      updatedAt: timestamp,
    },
  });
  console.log("OK  store settings created from env");
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
  await seedStoreSettings();
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
