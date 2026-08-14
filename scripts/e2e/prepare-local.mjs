/**
 * Start local Postgres (Docker), migrate, seed catalog + E2E admin, then run Playwright.
 *
 * Usage:
 *   npm run test:e2e:prep
 *   npm run test:e2e:prep -- e2e/admin-features.authenticated.spec.ts
 */
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const defaultDbUrl =
  "postgresql://vibe:vibe@localhost:5432/vibe?schema=public";

function run(command, options = {}) {
  execSync(command, { stdio: "inherit", cwd: root, ...options });
}

function dockerAvailable() {
  return spawnSync("docker", ["info"], { stdio: "ignore" }).status === 0;
}

function waitForPostgres(url) {
  run("npx tsx scripts/db/wait-for-postgres.mts", {
    env: { ...process.env, DATABASE_URL: url },
  });
}

async function main() {
  let databaseUrl = process.env.DATABASE_URL?.trim() || "";

  if (databaseUrl) {
    try {
      waitForPostgres(databaseUrl);
    } catch {
      databaseUrl = "";
    }
  }

  if (!databaseUrl) {
    console.log("[e2e:prep] DATABASE_URL unreachable — starting Docker Postgres…");
    if (!dockerAvailable()) {
      console.error(
        "Docker is not running. Start Docker Desktop, then:\n" +
          "  docker compose up -d postgres\n" +
          "  npm run setup:local\n" +
          "Or set DATABASE_URL to a reachable Postgres instance."
      );
      process.exit(1);
    }
    run("docker compose up -d postgres");
    databaseUrl = defaultDbUrl;
    waitForPostgres(databaseUrl);
  }

  const env = {
    ...process.env,
    DATABASE_URL: databaseUrl,
    E2E_TEST_MODE: "true",
    PLAYWRIGHT_REUSE_SERVER: "1",
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  };

  run("npx tsx scripts/db/seed-e2e-prereqs.mts", { env });

  const marker = path.join(root, "e2e", ".auth", "admin-seeded");
  if (!fs.existsSync(marker)) {
    console.error("[e2e:prep] admin seed marker missing after prep");
    process.exit(1);
  }

  const extraArgs = process.argv.slice(2).join(" ");
  run(extraArgs ? `npx playwright test ${extraArgs}` : "npm run test:e2e", { env });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
