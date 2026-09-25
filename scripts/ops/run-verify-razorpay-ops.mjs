/**
 * Run verify-razorpay-ops.mts (merged env files loaded inside the script).
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { MERGED_ENV_FILES } from "./load-merged-env.mjs";

const root = process.cwd();
const hasEnv = MERGED_ENV_FILES.some((file) => fs.existsSync(path.join(root, file)));

if (!hasEnv) {
  console.error("No .env / .env.local / .env.production env files found.");
  process.exit(1);
}

const result = spawnSync("npx", ["tsx", "scripts/ops/verify-razorpay-ops.mts"], {
  stdio: "inherit",
  cwd: root,
  shell: true,
});

process.exit(result.status ?? 1);
