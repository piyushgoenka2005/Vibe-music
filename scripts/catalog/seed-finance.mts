/**
 * Seed finance providers and EMI plans.
 * Usage: npx tsx --env-file=.env.local scripts/catalog/seed-finance.mts
 */
import { randomUUID } from "node:crypto";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const now = new Date().toISOString();

const PROVIDERS = [
  {
    id: "fin-hdfc",
    name: "HDFC Bank",
    slug: "hdfc-bank",
    type: "bank",
    processingFeePct: 1,
    sortOrder: 1,
  },
  {
    id: "fin-icici",
    name: "ICICI Bank",
    slug: "icici-bank",
    type: "bank",
    processingFeePct: 1,
    sortOrder: 2,
  },
  {
    id: "fin-bajaj",
    name: "Bajaj Finserv",
    slug: "bajaj-finserv",
    type: "nbfc",
    processingFeePct: 0,
    sortOrder: 3,
  },
  {
    id: "fin-visa",
    name: "Visa Card EMI",
    slug: "visa-card-emi",
    type: "card_network",
    processingFeePct: 0,
    sortOrder: 4,
  },
];

const PLANS = [
  { providerId: "fin-hdfc", name: "HDFC 3-month No Cost EMI", tenureMonths: 3, isNoCostEmi: true, emiType: "card" },
  { providerId: "fin-hdfc", name: "HDFC 6-month EMI", tenureMonths: 6, isNoCostEmi: false, emiType: "card", interestRateAnnual: 14 },
  { providerId: "fin-hdfc", name: "HDFC 12-month EMI", tenureMonths: 12, isNoCostEmi: false, emiType: "bank", interestRateAnnual: 15 },
  { providerId: "fin-icici", name: "ICICI 3-month No Cost EMI", tenureMonths: 3, isNoCostEmi: true, emiType: "card" },
  { providerId: "fin-icici", name: "ICICI 9-month EMI", tenureMonths: 9, isNoCostEmi: false, emiType: "bank", interestRateAnnual: 13.5 },
  { providerId: "fin-bajaj", name: "Bajaj 6-month No Cost EMI", tenureMonths: 6, isNoCostEmi: true, emiType: "bnpl" },
  { providerId: "fin-bajaj", name: "Bajaj 18-month EMI", tenureMonths: 18, isNoCostEmi: false, emiType: "bnpl", interestRateAnnual: 16 },
  { providerId: "fin-visa", name: "Visa 3-month Card EMI", tenureMonths: 3, isNoCostEmi: true, emiType: "card" },
  { providerId: "fin-visa", name: "Visa 6-month Card EMI", tenureMonths: 6, isNoCostEmi: false, emiType: "card", interestRateAnnual: 12 },
];

async function main() {
  for (const p of PROVIDERS) {
    await prisma.financeProvider.upsert({
      where: { id: p.id },
      create: {
        ...p,
        description: `${p.name} EMI partner for Vibe Music purchases.`,
        status: "active",
        minOrderValue: 5000,
        maxOrderValue: 500000,
        createdAt: now,
        updatedAt: now,
      },
      update: { name: p.name, updatedAt: now },
    });
  }

  for (const plan of PLANS) {
    const id = `plan-${plan.providerId}-${plan.tenureMonths}-${plan.emiType}`;
    await prisma.financePlan.upsert({
      where: { id },
      create: {
        id,
        providerId: plan.providerId,
        name: plan.name,
        tenureMonths: plan.tenureMonths,
        interestRateAnnual: plan.interestRateAnnual ?? 0,
        isNoCostEmi: plan.isNoCostEmi,
        emiType: plan.emiType,
        minOrderValue: 5000,
        maxOrderValue: 500000,
        downPaymentMinPct: 0,
        status: "active",
        createdAt: now,
        updatedAt: now,
      },
      update: { name: plan.name, updatedAt: now },
    });
  }

  console.log(`Seeded ${PROVIDERS.length} providers and ${PLANS.length} finance plans.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
