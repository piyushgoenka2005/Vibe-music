import { execSync } from "node:child_process";
import { loadLocalEnv } from "./load-env";

export default async function globalSetup(): Promise<void> {
  loadLocalEnv();

  if (!process.env.DATABASE_URL) {
    console.log("[e2e] DATABASE_URL not set — skipping E2E admin seed");
    return;
  }

  console.log("[e2e] Seeding E2E super-admin account…");
  execSync("npx tsx scripts/db/seed-e2e-admin.mts", {
    stdio: "inherit",
    env: process.env,
  });
}
