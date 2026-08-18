import "server-only";

import { isPostgresConfigured } from "@/lib/db/postgresConfig";
import { prisma } from "@/lib/db/prisma";

const HEALTH_QUERY_TIMEOUT_MS = 3_000;

export async function verifyPostgresConnection(): Promise<{
  ok: boolean;
  error?: string;
}> {
  if (!isPostgresConfigured()) {
    return { ok: false, error: "DATABASE_URL is not configured" };
  }

  try {
    // Health probes must fail fast. An unbounded database wait ties up a Node
    // worker and turns a monitoring check into a user-visible outage.
    await Promise.race([
      prisma.$queryRaw`SELECT 1`,
      new Promise<never>((_, reject) => {
        setTimeout(
          () => reject(new Error(`Database health check timed out after ${HEALTH_QUERY_TIMEOUT_MS}ms`)),
          HEALTH_QUERY_TIMEOUT_MS
        );
      }),
    ]);
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
