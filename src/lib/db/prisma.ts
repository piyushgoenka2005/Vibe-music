import "server-only";

import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

/** Next.js sets this during `next build`. */
export function isProductionBuildPhase(): boolean {
  return (
    process.env.NEXT_PHASE === "phase-production-build" ||
    process.env.NEXT_PRIVATE_BUILD_WORKER === "1"
  );
}

function isLocalhostDatabaseUrl(url: string): boolean {
  try {
    const normalized = url
      .replace(/^postgresql:\/\//, "http://")
      .replace(/^postgres:\/\//, "http://");
    const { hostname } = new URL(normalized);
    const host = hostname.toLowerCase();
    return host === "localhost" || host === "127.0.0.1" || host === "::1";
  } catch {
    return false;
  }
}

/**
 * True when PostgreSQL should be used for reads/writes.
 * Returns false during CI/Vercel builds and for localhost URLs on Vercel
 * (use static JSON catalog fallbacks instead).
 */
export function isPostgresConfigured(): boolean {
  const url = process.env.DATABASE_URL?.trim();
  if (!url) return false;

  if (isProductionBuildPhase()) {
    return false;
  }

  if (process.env.VERCEL && isLocalhostDatabaseUrl(url)) {
    return false;
  }

  return true;
}

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
