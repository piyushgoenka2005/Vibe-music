/**
 * Ensure Playwright E2E prerequisites: migrated schema, catalog categories, E2E admin.
 */
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { PrismaClient } from "@prisma/client";

const markerPath = path.join(process.cwd(), "e2e", ".auth", "admin-seeded");

async function main(): Promise<void> {
  if (!process.env.DATABASE_URL?.trim()) {
    console.error("DATABASE_URL is required for E2E database prep");
    process.exit(1);
  }

  execSync("npx tsx scripts/db/wait-for-postgres.mts", {
    stdio: "inherit",
    env: process.env,
  });

  execSync("npm run db:migrate", { stdio: "inherit", env: process.env });

  const prisma = new PrismaClient();
  try {
    const categoryCount = await prisma.category.count();
    if (categoryCount === 0) {
      console.log("[e2e] Seeding catalog (categories + products)…");
      execSync("npx tsx scripts/catalog/seed-catalog.mts", {
        stdio: "inherit",
        env: process.env,
      });
    } else {
      console.log(`[e2e] Catalog present (${categoryCount} categories)`);
    }
  } finally {
    await prisma.$disconnect();
  }

  execSync("npx tsx scripts/db/seed-e2e-admin.mts", {
    stdio: "inherit",
    env: process.env,
  });

  fs.mkdirSync(path.dirname(markerPath), { recursive: true });
  fs.writeFileSync(markerPath, new Date().toISOString(), "utf8");
  console.log("[e2e] Database prerequisites ready");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
