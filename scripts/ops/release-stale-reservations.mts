/**
 * Release abandoned inventory reservations (TTL sweeper).
 * Finds pending/unpaid orders stuck in inventoryStatus=reserved beyond TTL.
 *
 * Loads `.env` then `.env.local` (local overrides) so VPS cron can use `.env`
 * without requiring `.env.local`. Existing process.env wins.
 *
 * Usage:
 *   npm run ops:release-stale-reservations
 *   RESERVATION_TTL_MINUTES=45 npm run ops:release-stale-reservations
 */
import fs from "node:fs";
import path from "node:path";
import { PrismaClient } from "@prisma/client";
import { releaseReservedStockForOrder } from "../../src/lib/server/inventoryRepository";

function readEnvFile(file: string): Record<string, string> {
  const full = path.join(process.cwd(), file);
  if (!fs.existsSync(full)) return {};
  const out: Record<string, string> = {};
  for (const line of fs.readFileSync(full, "utf8").split(/\r?\n/)) {
    if (!line || line.trimStart().startsWith("#")) continue;
    const idx = line.indexOf("=");
    if (idx <= 0) continue;
    const key = line.slice(0, idx).trim();
    if (!key) continue;
    let value = line.slice(idx + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    out[key] = value;
  }
  return out;
}

const fileEnv = {
  ...readEnvFile(".env"),
  ...readEnvFile(".env.local"),
};

for (const [key, value] of Object.entries(fileEnv)) {
  if (process.env[key] == null || process.env[key] === "") {
    process.env[key] = value;
  }
}

if (!process.env.DATABASE_URL) {
  console.error(
    "DATABASE_URL is required. Set it in the environment, .env, or .env.local."
  );
  process.exit(1);
}

const prisma = new PrismaClient();
const TTL_MINUTES = Math.max(
  5,
  Number(process.env.RESERVATION_TTL_MINUTES ?? "45") || 45
);

async function main() {
  const cutoff = new Date(Date.now() - TTL_MINUTES * 60_000).toISOString();
  const stale = await prisma.order.findMany({
    where: {
      inventoryStatus: "reserved",
      paymentStatus: { in: ["pending", "failed"] },
      updatedAt: { lt: cutoff },
    },
    select: {
      id: true,
      items: true,
      paymentStatus: true,
      updatedAt: true,
    },
    take: 200,
  });

  let released = 0;
  for (const order of stale) {
    const items = Array.isArray(order.items)
      ? (order.items as Array<{
          productId: string;
          variantId?: string;
          quantity: number;
          name?: string;
        }>)
      : [];
    const lines = items
      .filter((item) => item?.productId && item.quantity > 0)
      .map((item) => ({
        productId: item.productId,
        variantId: item.variantId,
        quantity: item.quantity,
        name: item.name,
      }));

    try {
      if (lines.length > 0) {
        await releaseReservedStockForOrder(order.id, lines);
      } else {
        await prisma.order.update({
          where: { id: order.id },
          data: {
            inventoryStatus: "none",
            updatedAt: new Date().toISOString(),
          },
        });
      }
      released += 1;
      console.log(`released ${order.id} (updatedAt=${order.updatedAt})`);
    } catch (error) {
      console.error(`failed ${order.id}`, error);
    }
  }

  console.log(
    JSON.stringify({
      ttlMinutes: TTL_MINUTES,
      cutoff,
      candidates: stale.length,
      released,
    })
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
