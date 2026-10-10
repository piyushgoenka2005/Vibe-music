#!/usr/bin/env npx tsx
/**
 * Admin console + customer account dashboard E2E gate.
 *
 * Requires DATABASE_URL (e.g. from .env.local) and Playwright browsers.
 *
 *   npm run test:e2e:prep
 *   npm run verify:e2e-admin-account
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();

if (!process.env.DATABASE_URL?.trim()) {
  console.error("verify:e2e-admin-account: DATABASE_URL is required (use .env.local).");
  process.exit(1);
}

const marker = path.join(ROOT, "e2e", ".auth", "admin-seeded");
if (!fs.existsSync(marker)) {
  console.log("Running test:e2e:prep (migrate + seed)…");
  const prep = spawnSync("npm", ["run", "test:e2e:prep"], {
    cwd: ROOT,
    stdio: "inherit",
    shell: process.platform === "win32",
    env: process.env,
  });
  if ((prep.status ?? 1) !== 0) process.exit(prep.status ?? 1);
}

const specs = [
  "e2e/admin.authenticated.spec.ts",
  "e2e/admin.crud-smoke.spec.ts",
  "e2e/admin.security.spec.ts",
  "e2e/admin-product-edit.authenticated.spec.ts",
  "e2e/account.authenticated.spec.ts",
  "e2e/idor.authenticated.spec.ts",
];

const result = spawnSync(
  "npx",
  ["playwright", "test", ...specs, "--project=admin-authenticated", "--project=idor-authenticated"],
  {
    cwd: ROOT,
    stdio: "inherit",
    shell: process.platform === "win32",
    env: process.env,
  },
);

process.exit(result.status ?? 1);
