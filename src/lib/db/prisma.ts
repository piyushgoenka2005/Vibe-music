import "server-only";

import { PrismaClient } from "@prisma/client";
import {
  isPostgresConfigured,
  isProductionBuildPhase,
} from "@/lib/db/postgresConfig";

export { isPostgresConfigured, isProductionBuildPhase };

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient(): PrismaClient {
  if (!isPostgresConfigured()) {
    throw new Error(
      "DATABASE_URL is not configured. Add it to .env.local (dev) or your deployment environment."
    );
  }

  return new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["warn", "error"]
        : ["error"],
  });
}

function getPrismaClient(): PrismaClient {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = createPrismaClient();
  }
  return globalForPrisma.prisma;
}

/** Lazy Prisma client — avoids crashing import-time when DATABASE_URL is unset. */
export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop, receiver) {
    const client = getPrismaClient();
    const value = Reflect.get(client, prop, receiver);
    return typeof value === "function"
      ? (value as (...args: unknown[]) => unknown).bind(client)
      : value;
  },
});
