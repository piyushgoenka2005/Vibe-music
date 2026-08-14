import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import { E2E_ADMIN_STORAGE_PATH } from "./helpers/admin-auth";
import { E2E_ADMIN_SEED_MARKER } from "./helpers/e2e-paths";
import { loadLocalEnv } from "./load-env";

const EMPTY_STORAGE = JSON.stringify({ cookies: [], origins: [] });

export default async function globalSetup(): Promise<void> {
  loadLocalEnv();

  fs.mkdirSync(path.dirname(E2E_ADMIN_SEED_MARKER), { recursive: true });
  if (fs.existsSync(E2E_ADMIN_SEED_MARKER)) {
    fs.unlinkSync(E2E_ADMIN_SEED_MARKER);
  }
  if (!fs.existsSync(E2E_ADMIN_STORAGE_PATH)) {
    fs.writeFileSync(E2E_ADMIN_STORAGE_PATH, EMPTY_STORAGE, "utf8");
  }

  if (!process.env.DATABASE_URL?.trim()) {
    const message = "[e2e] DATABASE_URL not set — authenticated admin E2E will skip";
    if (process.env.CI) {
      throw new Error(`${message} (required in CI)`);
    }
    console.log(message);
    return;
  }

  console.log("[e2e] Preparing database (migrate, catalog, E2E admin)…");
  try {
    execSync("npx tsx scripts/db/seed-e2e-prereqs.mts", {
      stdio: "inherit",
      env: process.env,
    });
    if (!fs.existsSync(E2E_ADMIN_SEED_MARKER)) {
      throw new Error("E2E admin seed marker was not created");
    }
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "E2E database preparation failed";
    if (process.env.CI) {
      throw new Error(`[e2e] ${message}`);
    }
    console.warn(
      `[e2e] Database prep failed (Postgres unreachable?). Authenticated E2E will skip.\n` +
        `  Fix: docker compose up -d postgres && npm run test:e2e:prep\n` +
        `  Detail: ${message}`
    );
  }
}
