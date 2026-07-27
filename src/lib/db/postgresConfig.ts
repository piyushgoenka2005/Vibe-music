import "server-only";

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
 * Does not import Prisma — safe for instrumentation / env checks.
 *
 * During `next build`, Postgres is skipped by default so SSG can run without a
 * live database. Set ALLOW_POSTGRES_DURING_BUILD=true when validating/releasing
 * with a real DATABASE_URL (CI Postgres service or local release closure).
 */
export function isPostgresConfigured(): boolean {
  const url = process.env.DATABASE_URL?.trim();
  if (!url) return false;

  if (isProductionBuildPhase()) {
    return process.env.ALLOW_POSTGRES_DURING_BUILD === "true";
  }

  if (process.env.VERCEL && isLocalhostDatabaseUrl(url)) {
    return false;
  }

  return true;
}
