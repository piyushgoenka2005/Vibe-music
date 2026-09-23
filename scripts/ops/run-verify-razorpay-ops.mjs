/**
 * Run verify-razorpay-ops.mts against the best available env file (.env for VPS, .env.local for dev).
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const candidates = [".env", ".env.production", ".env.local"];
const envFile = candidates.find((file) => fs.existsSync(path.join(root, file)));

if (!envFile) {
  console.error("No .env, .env.production, or .env.local found.");
  process.exit(1);
}

const result = spawnSync(
  "npx",
  ["tsx", `--env-file=${envFile}`, "scripts/ops/verify-razorpay-ops.mts"],
  { stdio: "inherit", cwd: root, shell: true },
);

process.exit(result.status ?? 1);
