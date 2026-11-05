/**
 * Database migration script to restructure category hierarchy and add sample cable products.
 * Run with: npx tsx scripts/db/restructure-categories.ts
 */

import { PrismaClient } from "@prisma/client";
import { slugify } from "../src/lib/slug";

const prisma = new PrismaClient();

async function main() {
  console.log("Starting category restructure migration...");

  // Step 1: Create parent category "Accessories"
  console.log("Creating Accessories parent category...");
  const accessories = await prisma.category.upsert({
    where: { slug: "accessories" },
    update: {},
    create: {
      id: "cat-accessories",
      name: "Accessories",
      slug: "accessories",
      description:
        "Shop accessories including cables, cases, stands, and essentials for musicians.",
      isActive: true,
      sortOrder: 13,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  });
  console.log(`✓ Created/updated Accessories category: ${accessories.id}`);

  // Step 2: Create child categories under Accessories
  console.log("Creating child categories...");

  const cables = await prisma.category.upsert({
    where: { slug: "cables" },
    update: { parentId: accessories.id },
    create: {
      id: "cat-cables",
      name: "Cables",
      slug: "cables",
      description: "Shop instrument cables, XLR cables, patch cables, and power adapters.",
      parentId: accessories.id,
      isActive: true,
      sortOrder: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  });
  console.log(`✓ Created/updated Cables category: ${cables.id}`);

  const casesBags = await prisma.category.upsert({
    where: { slug: "cases-bags" },
    update: { parentId: accessories.id },
    create: {
      id: "cat-cases-bags",
      name: "Cases & Bags",
      slug: "cases-bags",
      description: "Shop guitar cases, keyboard bags, rack cases, and pedalboards.",
      parentId: accessories.id,
      isActive: true,
      sortOrder: 2,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  });
  console.log(`✓ Created/updated Cases & Bags category: ${casesBags.id}`);

  const essentials = await prisma.category.upsert({
    where: { slug: "essentials" },
    update: { parentId: accessories.id },
    create: {
      id: "cat-essentials",
      name: "Essentials",
      slug: "essentials",
      description: "Shop stands, tuners, metronomes, and care & cleaning products.",
      parentId: accessories.id,
      isActive: true,
      sortOrder: 3,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  });
  console.log(`✓ Created/updated Essentials category: ${essentials.id}`);

  // Step 3: Move existing stand products to Essentials category
  console.log("Moving existing stand products to Essentials category...");
  const standProducts = await prisma.product.findMany({
    where: {
      categorySlug: "cables-cases-accessories",
      OR: [
        { subcategory: { contains: "Stand", mode: "insensitive" } },
        { name: { contains: "Stand", mode: "insensitive" } },
      ],
    },
  });

  for (const product of standProducts) {
    await prisma.product.update({
      where: { id: product.id },
      data: {
        category: "Essentials",
        categorySlug: "essentials",
      },
    });
    console.log(`✓ Moved ${product.name} to Essentials`);
  }

  // Step 4: Create sample cable products
  console.log("Creating sample cable products...");

  const cableProducts = [
    {
      id: "prod-hertz-instrument-cable-10ft",
      slug: "hertz-instrument-cable-10ft-professional-guitar-lead",
      name: "HERTZ Instrument Cable 10ft - Professional Guitar Lead",
      sku: "HZ-IC-10",
      brand: "HERTZ",
      category: "Cables",
      categorySlug: "cables",
      subcategory: "Instrument Cables",
      price: 499,
      originalPrice: 599,
      rating: 4.5,
      reviewCount: 12,
      stock: 50,
      status: "active",
      featured: true,
      trending: false,
      newArrival: false,
      description:
        "Professional instrument cable for guitars and keyboards. 10ft length with durable connectors and noise-free signal transmission.",
      image: "/images/products/hertz-instrument-cable-10ft.jpg",
      imageColor: "Black",
      brandSlug: "hertz",
      availability: "in-stock",
      condition: "new",
      specifications: {
        Length: "10ft",
        "Connector Type": "1/4 inch TS",
        Color: "Black",
        Material: "OFC Copper",
      },
    },
    {
      id: "prod-hertz-instrument-cable-20ft",
      slug: "hertz-instrument-cable-20ft-professional-guitar-lead",
      name: "HERTZ Instrument Cable 20ft - Professional Guitar Lead",
      sku: "HZ-IC-20",
      brand: "HERTZ",
      category: "Cables",
      categorySlug: "cables",
      subcategory: "Instrument Cables",
      price: 699,
      originalPrice: 799,
      rating: 4.7,
      reviewCount: 8,
      stock: 35,
      status: "active",
      featured: true,
      trending: false,
      newArrival: false,
      description:
        "Professional instrument cable for guitars and keyboards. 20ft length with durable connectors and noise-free signal transmission.",
      image: "/images/products/hertz-instrument-cable-20ft.jpg",
      imageColor: "Black",
      brandSlug: "hertz",
      availability: "in-stock",
      condition: "new",
      specifications: {
        Length: "20ft",
        "Connector Type": "1/4 inch TS",
        Color: "Black",
        Material: "OFC Copper",
      },
    },
    {
      id: "prod-hertz-xlr-cable-10ft",
      slug: "hertz-xlr-microphone-cable-10ft-professional-mic-lead",
      name: "HERTZ XLR Microphone Cable 10ft - Professional Mic Lead",
      sku: "HZ-XLR-10",
      brand: "HERTZ",
      category: "Cables",
      categorySlug: "cables",
      subcategory: "XLR & Mic Cables",
      price: 549,
      originalPrice: 649,
      rating: 4.6,
      reviewCount: 15,
      stock: 40,
      status: "active",
      featured: true,
      trending: false,
      newArrival: false,
      description:
        "Professional XLR microphone cable for studio and live performance. 10ft length with balanced connectors for noise-free audio.",
      image: "/images/products/hertz-xlr-cable-10ft.jpg",
      imageColor: "Black",
      brandSlug: "hertz",
      availability: "in-stock",
      condition: "new",
      specifications: {
        Length: "10ft",
        "Connector Type": "XLR Male to XLR Female",
        Color: "Black",
        Material: "OFC Copper",
      },
    },
    {
      id: "prod-hertz-patch-cable-6in",
      slug: "hertz-patch-cable-6-inch-pedal-patch-cord",
      name: "HERTZ Patch Cable 6 inch - Pedal Patch Cord",
      sku: "HZ-PATCH-6",
      brand: "HERTZ",
      category: "Cables",
      categorySlug: "cables",
      subcategory: "Patch Cables",
      price: 299,
      originalPrice: 349,
      rating: 4.4,
      reviewCount: 20,
      stock: 100,
      status: "active",
      featured: false,
      trending: true,
      newArrival: false,
      description:
        "Professional patch cable for pedalboards. 6 inch length with right-angle connectors for compact setups.",
      image: "/images/products/hertz-patch-cable-6in.jpg",
      imageColor: "Black",
      brandSlug: "hertz",
      availability: "in-stock",
      condition: "new",
      specifications: {
        Length: "6 inch",
        "Connector Type": "1/4 inch TS Right Angle",
        Color: "Black",
        Material: "OFC Copper",
      },
    },
    {
      id: "prod-hertz-power-adapter-9v",
      slug: "hertz-power-adapter-9v-dc-universal-power-supply",
      name: "HERTZ Power Adapter 9V DC - Universal Power Supply",
      sku: "HZ-PWR-9V",
      brand: "HERTZ",
      category: "Cables",
      categorySlug: "cables",
      subcategory: "Power & Adapters",
      price: 799,
      originalPrice: 899,
      rating: 4.8,
      reviewCount: 25,
      stock: 60,
      status: "active",
      featured: true,
      trending: false,
      newArrival: false,
      description:
        "Universal 9V DC power adapter for effects pedals and electronic instruments. Multiple polarity options included.",
      image: "/images/products/hertz-power-adapter-9v.jpg",
      imageColor: "Black",
      brandSlug: "hertz",
      availability: "in-stock",
      condition: "new",
      specifications: {
        Voltage: "9V DC",
        Current: "500mA",
        Connector: "2.1mm Barrel",
        Polarity: "Center Negative",
      },
    },
  ];

  for (const productData of cableProducts) {
    const existing = await prisma.product.findUnique({
      where: { id: productData.id },
    });

    if (existing) {
      await prisma.product.update({
        where: { id: productData.id },
        data: productData,
      });
      console.log(`✓ Updated existing cable product: ${productData.name}`);
    } else {
      await prisma.product.create({
        data: {
          ...productData,
          images: JSON.stringify([productData.image]),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      });
      console.log(`✓ Created new cable product: ${productData.name}`);
    }
  }

  // Step 5: Update old category name and mark as archived (optional)
  console.log("Archiving old category...");
  await prisma.category.update({
    where: { id: "cat-13" },
    data: {
      name: "Legacy Accessories (Archived)",
      isArchived: true,
      isActive: false,
      updatedAt: new Date().toISOString(),
    },
  });
  console.log("✓ Archived old cat-13 category");

  console.log("\n✅ Migration completed successfully!");
  console.log("\nSummary:");
  console.log(`- Created Accessories parent category: ${accessories.id}`);
  console.log(`- Created Cables child category: ${cables.id}`);
  console.log(`- Created Cases & Bags child category: ${casesBags.id}`);
  console.log(`- Created Essentials child category: ${essentials.id}`);
  console.log(`- Moved ${standProducts.length} stand products to Essentials`);
  console.log(`- Created/updated ${cableProducts.length} cable products`);
}

main()
  .catch((e) => {
    console.error("Migration failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
