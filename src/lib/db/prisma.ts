import "server-only";

import { PrismaClient } from "@prisma/client";
import { isPostgresConfigured, isProductionBuildPhase } from "@/lib/db/postgresConfig";
import { dbCircuitBreaker } from "@/lib/security/circuit-breaker";

export { isPostgresConfigured, isProductionBuildPhase };

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

/**
 * Production-grade connection pool settings:
 * - connection_limit: 20 handles ~2K concurrent users (each process gets 20
 *   connections; PM2 cluster multiplies this across CPU cores).
 * - pool_timeout: 10s — fail fast rather than queuing indefinitely.
 *
 * Circuit breaker integration:
 *   If DB fails 5 times in 30s, circuit opens for 30s. During that window,
 *   all DB queries fail instantly (<1ms) instead of waiting 10s each.
 *   For 2K concurrent users, this prevents 20,000s of wasted wait time.
 */
const isProd = process.env.NODE_ENV === "production";
const CONNECTION_LIMIT = isProd ? 20 : 10;
const POOL_TIMEOUT_MS = 10_000;

function createPrismaClient(): PrismaClient {
  if (!isPostgresConfigured()) {
    throw new Error(
      "DATABASE_URL is not configured. Add it to .env.local (dev) or your deployment environment.",
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

function getPrismaClient(): PrismaClient | null {
  if (!isPostgresConfigured()) {
    return null;
  }
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = createPrismaClient();
  }
  return globalForPrisma.prisma;
}

/**
 * Get the raw Prisma client (bypassing circuit breaker).
 * Use only for health checks and metrics.
 * Returns null when Postgres is not configured.
 */
export function getRawPrisma(): PrismaClient | null {
  return getPrismaClient();
}

/**
 * Read-only Prisma methods that return safe empty defaults when DB is unavailable.
 */
const SAFE_READ_DEFAULTS: Record<string, unknown> = {
  findUnique: null,
  findFirst: null,
  findUniqueOrThrow: () => {
    throw new Error("Record not found (database unavailable)");
  },
  findFirstOrThrow: () => {
    throw new Error("Record not found (database unavailable)");
  },
  findMany: [],
  count: 0,
  aggregate: { _sum: {}, _avg: {}, _min: {}, _max: {}, _count: 0 },
  groupBy: [],
};

/**
 * Write methods that should fail explicitly when DB is unavailable.
 */
const WRITE_METHODS = new Set([
  "create",
  "createMany",
  "update",
  "updateMany",
  "upsert",
  "delete",
  "deleteMany",
  "executeRaw",
  "queryRaw",
]);

/**
 * Lazy Prisma client — avoids crashing import-time when DATABASE_URL is unset.
 *
 * When Postgres is NOT configured:
 *   Read operations (findMany, findUnique, count, etc.) return safe empty
 *   defaults so the entire application degrades gracefully — empty order lists,
 *   null lookups, zero counts — instead of throwing.
 *
 *   Write operations (create, update, delete, etc.) throw a clear error
 *   so mutations fail loudly rather than silently succeeding.
 *
 * When Postgres IS configured:
 *   All operations go through the circuit breaker. If DB is down:
 *   - Circuit opens after 5 failures
 *   - Remaining queries fail instantly with CircuitBreakerOpenError
 *   - After 30s cooldown, one probe query is allowed
 *   - If probe succeeds → circuit closes, normal operation resumes
 */
export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop, receiver) {
    const client = getPrismaClient();

    // When Postgres is not configured, return safe defaults for reads
    // and explicit errors for writes.
    if (!client) {
      if (typeof prop === "string") {
        // Handle $transaction, $extends, $connect, $disconnect, etc.
        if (prop.startsWith("$")) {
          if (prop === "$transaction") {
            return (fns: unknown[]) => {
              // Execute functions in sequence; each gets the same no-op proxy
              return Promise.all(
                (Array.isArray(fns) ? fns : [fns]).map((fn) =>
                  typeof fn === "function" ? fn(prisma) : fn,
                ),
              );
            };
          }
          if (prop === "$connect" || prop === "$disconnect") {
            return () => Promise.resolve();
          }
          return () => {
            throw new Error(`Prisma ${prop} unavailable: DATABASE_URL is not configured.`);
          };
        }

        if (WRITE_METHODS.has(prop)) {
          return () =>
            Promise.reject(
              new Error(`Database write (${prop}) unavailable: DATABASE_URL is not configured.`),
            );
        }

        if (prop in SAFE_READ_DEFAULTS) {
          const defaultVal = SAFE_READ_DEFAULTS[prop];
          if (typeof defaultVal === "function") {
            return defaultVal;
          }
          return () => Promise.resolve(defaultVal);
        }

        // Model access (e.g., prisma.order, prisma.user) — return a
        // recursive no-op proxy for the model's methods.
        return new Proxy({} as object, {
          get(_mTarget, mProp) {
            if (typeof mProp === "string") {
              if (mProp.startsWith("$")) {
                if (mProp === "$connect" || mProp === "$disconnect") {
                  return () => Promise.resolve();
                }
                return () =>
                  Promise.reject(
                    new Error(`Prisma ${mProp} unavailable: DATABASE_URL is not configured.`),
                  );
              }
              if (WRITE_METHODS.has(mProp)) {
                return () =>
                  Promise.reject(
                    new Error(
                      `Database write (${mProp}) unavailable: DATABASE_URL is not configured.`,
                    ),
                  );
              }
              if (mProp in SAFE_READ_DEFAULTS) {
                const dv = SAFE_READ_DEFAULTS[mProp];
                if (typeof dv === "function") return dv;
                return () => Promise.resolve(dv);
              }
              // Unknown method on model — return empty
              return () => Promise.resolve(null);
            }
            return undefined;
          },
        });
      }
      return undefined;
    }

    // Postgres is configured — use real client with circuit breaker
    const value = Reflect.get(client, prop, receiver);

    if (typeof value === "function") {
      const boundFn = value as (...args: unknown[]) => unknown;

      // Wrap all database operations with circuit breaker
      return (...args: unknown[]) =>
        dbCircuitBreaker.execute(async () => boundFn.apply(client, args) as Promise<unknown>);
    }

    return value;
  },
});
