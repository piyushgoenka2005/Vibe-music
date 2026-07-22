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

  if (!process.env.DATABASE_URL) {
    console.log("[e2e] DATABASE_URL not set — skipping E2E admin seed");
    return;
  }

  console.log("[e2e] Seeding E2E super-admin account…");
  try {
    execSync("npx tsx scripts/db/seed-e2e-admin.mts", {
      stdio: "inherit",
      env: process.env,
    });
    fs.writeFileSync(E2E_ADMIN_SEED_MARKER, "1", "utf8");
  } catch (error) {
    console.warn(
      "[e2e] Admin seed failed (database unreachable?). Continuing without admin auth setup.",
      error instanceof Error ? error.message : error
    );
  }
}
