/**
 * Block until DATABASE_URL accepts connections (for E2E / CI).
 */
import { PrismaClient } from "@prisma/client";

const url = process.env.DATABASE_URL?.trim();
if (!url) {
  console.error("DATABASE_URL is required");
  process.exit(1);
}

const maxAttempts = Number(process.env.DB_WAIT_ATTEMPTS ?? 30);
const delayMs = Number(process.env.DB_WAIT_DELAY_MS ?? 2000);

async function sleep(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function main(): Promise<void> {
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const prisma = new PrismaClient({ datasources: { db: { url } } });
    try {
      await prisma.$queryRawUnsafe("SELECT 1");
      console.log(`Postgres ready (attempt ${attempt}/${maxAttempts})`);
      return;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.log(
        `[db:wait] attempt ${attempt}/${maxAttempts} — ${message.split("\n")[0]}`
      );
      if (attempt === maxAttempts) throw error;
      await sleep(delayMs);
    } finally {
      await prisma.$disconnect().catch(() => {});
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
