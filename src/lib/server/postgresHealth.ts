import "server-only";

import { isPostgresConfigured, prisma } from "@/lib/db/prisma";

export async function verifyPostgresConnection(): Promise<{
  ok: boolean;
  error?: string;
}> {
  if (!isPostgresConfigured()) {
    return { ok: false, error: "DATABASE_URL is not configured" };
  }

  try {
    await prisma.$queryRaw`SELECT 1`;
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
