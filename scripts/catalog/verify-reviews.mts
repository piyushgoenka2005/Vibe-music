import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const sample = await prisma.product.findFirst({
  where: { sku: "VM-AD12DSP" },
  select: { rating: true, reviewCount: true, slug: true },
});

const bengali = await prisma.review.findMany({
  where: { author: { contains: "Mukherjee" } },
  take: 3,
  select: { author: true, rating: true },
});

const written = await prisma.review.count({
  where: {
    productSlug: sample?.slug,
    NOT: { title: { contains: "star rating" } },
  },
});

console.log(JSON.stringify({ sample, written, bengali }, null, 2));
await prisma.$disconnect();
