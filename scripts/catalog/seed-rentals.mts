/**
 * Seed rental categories, products, inventory units, and default policy.
 * Usage: npx tsx --env-file=.env.local scripts/catalog/seed-rentals.mts
 */
import { randomUUID } from "node:crypto";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const now = new Date().toISOString();

const CATEGORIES = [
  { id: "rent-cat-keyboards", name: "Keyboards & Synths", slug: "keyboards-synthesizers", sortOrder: 1 },
  { id: "rent-cat-guitars", name: "Guitars & Bass", slug: "guitars-bass", sortOrder: 2 },
  { id: "rent-cat-live", name: "Live Sound & PA", slug: "live-sound-pa", sortOrder: 3 },
  { id: "rent-cat-drums", name: "Drums & Percussion", slug: "drums-percussion", sortOrder: 4 },
];

const PRODUCTS = [
  {
    id: "rent-prod-yamaha-psr",
    slug: "yamaha-psr-e473-rental",
    name: "Yamaha PSR-E473 (Rental)",
    categoryId: "rent-cat-keyboards",
    description: "61-key portable keyboard for gigs, worship, and practice sessions.",
    image: "https://cdn.vibemusic.in/products/yamaha-psr-e473-1.webp",
    dailyRate: 499,
    weeklyRate: 2499,
    monthlyRate: 7999,
    hourlyRate: 99,
    depositAmount: 3000,
    totalUnits: 3,
    featured: true,
  },
  {
    id: "rent-prod-fender-strat",
    slug: "fender-player-strat-rental",
    name: "Fender Player Stratocaster (Rental)",
    categoryId: "rent-cat-guitars",
    description: "Road-ready electric guitar with gig bag for sessions and events.",
    image: "https://cdn.vibemusic.in/products/fender-player-strat-1.webp",
    dailyRate: 399,
    weeklyRate: 1999,
    monthlyRate: 6499,
    hourlyRate: 79,
    depositAmount: 5000,
    totalUnits: 2,
    featured: true,
  },
  {
    id: "rent-prod-jbl-prx",
    slug: "jbl-prx815w-rental",
    name: "JBL PRX815W Powered Speaker (Rental)",
    categoryId: "rent-cat-live",
    description: "Single powered PA speaker for small venues, DJ setups, and events.",
    image: "https://cdn.vibemusic.in/products/jbl-prx815w-1.webp",
    dailyRate: 899,
    weeklyRate: 4499,
    monthlyRate: 12999,
    hourlyRate: 149,
    depositAmount: 8000,
    totalUnits: 4,
    deliveryFee: 299,
    featured: true,
  },
  {
    id: "rent-prod-roland-kit",
    slug: "roland-td17kv-rental",
    name: "Roland TD-17KV Electronic Drum Kit (Rental)",
    categoryId: "rent-cat-drums",
    description: "Compact e-kit for silent practice, studio sessions, and small stages.",
    image: "https://cdn.vibemusic.in/products/roland-td17kv-1.webp",
    dailyRate: 699,
    weeklyRate: 3499,
    monthlyRate: 10999,
    hourlyRate: 119,
    depositAmount: 6000,
    totalUnits: 2,
    featured: false,
  },
];

async function main() {
  for (const cat of CATEGORIES) {
    await prisma.rentalCategory.upsert({
      where: { id: cat.id },
      create: {
        ...cat,
        description: `${cat.name} available for short-term rental.`,
        status: "active",
        createdAt: now,
        updatedAt: now,
      },
      update: { name: cat.name, slug: cat.slug, sortOrder: cat.sortOrder, updatedAt: now },
    });
  }

  for (const product of PRODUCTS) {
    await prisma.rentalProduct.upsert({
      where: { id: product.id },
      create: {
        id: product.id,
        slug: product.slug,
        name: product.name,
        categoryId: product.categoryId,
        description: product.description,
        image: product.image,
        images: [product.image],
        specifications: {},
        status: "active",
        totalUnits: product.totalUnits,
        availableUnits: product.totalUnits,
        reservedUnits: 0,
        minDurationHours: 4,
        maxDurationDays: 30,
        depositAmount: product.depositAmount,
        hourlyRate: product.hourlyRate,
        dailyRate: product.dailyRate,
        weeklyRate: product.weeklyRate,
        monthlyRate: product.monthlyRate,
        pickupAvailable: true,
        deliveryAvailable: true,
        deliveryFee: product.deliveryFee ?? 0,
        pickupFee: 0,
        lateFeePerDay: Math.round(product.dailyRate * 0.5),
        damagePolicy: "Damage beyond normal wear billed at repair cost.",
        termsText: "Valid ID required. Deposit refunded after inspection.",
        agreementText: "Renter accepts liability for loss or damage during rental period.",
        featured: product.featured,
        createdAt: now,
        updatedAt: now,
      },
      update: {
        name: product.name,
        slug: product.slug,
        dailyRate: product.dailyRate,
        updatedAt: now,
      },
    });

    for (let i = 1; i <= product.totalUnits; i += 1) {
      const unitId = `${product.id}-unit-${i}`;
      await prisma.rentalInventoryUnit.upsert({
        where: { id: unitId },
        create: {
          id: unitId,
          productId: product.id,
          label: `Unit ${i}`,
          serialNumber: `VM-RNT-${product.id.slice(-4).toUpperCase()}-${i}`,
          status: "available",
          createdAt: now,
          updatedAt: now,
        },
        update: { label: `Unit ${i}`, updatedAt: now },
      });
    }
  }

  await prisma.rentalPolicy.upsert({
    where: { id: "default" },
    create: {
      id: "default",
      title: "Vibe Music Rental Terms",
      termsHtml: "<p>Renter must present valid government ID. Gear must be returned in the same condition.</p>",
      agreementHtml: "<p>I agree to pay rental fees, deposit, late fees, and damage charges as applicable.</p>",
      cancellationPolicy: "Free cancellation up to 24 hours before scheduled pickup.",
      lateFeePolicy: "Late returns incur daily late fees listed on each product page.",
      damagePolicy: "Damage or loss beyond normal wear may be charged against the deposit.",
      updatedAt: now,
    },
    update: { updatedAt: now },
  });

  console.log(`Seeded ${CATEGORIES.length} rental categories and ${PRODUCTS.length} rental products.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
