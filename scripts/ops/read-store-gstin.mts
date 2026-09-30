#!/usr/bin/env npx tsx
/**
 * Print configured GSTIN from env or store settings (stdout only, no secrets beyond GSTIN).
 * Used by deploy/production.sh compliance before interactive prompt.
 */
import { PrismaClient } from "@prisma/client";

const GSTIN_PATTERN = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][0-9A-Z]Z[0-9A-Z]$/;

function fromEnv(): string {
  return process.env.NEXT_PUBLIC_GSTIN?.trim() || process.env.STORE_GSTIN?.trim() || "";
}

async function fromDatabase(): Promise<string> {
  const prisma = new PrismaClient();
  try {
    const settings = await prisma.storeSettings.findUnique({
      where: { id: "store" },
      select: { gstNumber: true },
    });
    return settings?.gstNumber?.trim() || "";
  } finally {
    await prisma.$disconnect();
  }
}

async function main(): Promise<void> {
  const candidates = [fromEnv(), await fromDatabase()];
  for (const value of candidates) {
    if (GSTIN_PATTERN.test(value)) {
      console.log(value);
      return;
    }
  }
}

main().catch(() => {
  process.exitCode = 0;
});
