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

/**
 * Production-grade connection pool settings:
 * - connection_limit: 20 handles ~2K concurrent users (each process gets 20
 *   connections; PM2 cluster multiplies this across CPU cores).
 * - pool_timeout: 10s — fail fast rather than queuing indefinitely.
 */
const isProd = process.env.NODE_ENV === "production";
const CONNECTION_LIMIT = isProd ? 20 : 10;
const POOL_TIMEOUT_MS = 10_000;

function createPrismaClient(): PrismaClient {
  if (!isPostgresConfigured()) {
    throw new Error(
      "DATABASE_URL is not configured. Add it to .env.local (dev) or your deployment environment."
    );
  }

  // Append pool params to DATABASE_URL if not already present.
  const base = process.env.DATABASE_URL!;
  const url = new URL(base);
  if (!url.searchParams.has("connection_limit")) {
    url.searchParams.set("connection_limit", String(CONNECTION_LIMIT));
  }
  if (!url.searchParams.has("pool_timeout")) {
    url.searchParams.set("pool_timeout", String(POOL_TIMEOUT_MS / 1000));
  }

  return new PrismaClient({
    datasourceUrl: url.toString(),
    log: isProd ? ["error"] : ["warn", "error"],
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
