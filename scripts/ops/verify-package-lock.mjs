#!/usr/bin/env node
/**
 * Ensure package-lock.json is compatible with npm 10.x (production VPS).
 * npm 12+ can accept a lockfile that npm 10 rejects (missing optional OTEL peers).
 */
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const lockPath = path.join(ROOT, "package-lock.json");

if (!fs.existsSync(lockPath)) {
  console.error("verify-package-lock: package-lock.json missing");
  process.exit(1);
}

const lock = fs.readFileSync(lockPath, "utf8");
const requiredEntries = [
  "node_modules/lighthouse/node_modules/@opentelemetry/exporter-trace-otlp-http",
  "node_modules/lighthouse/node_modules/@opentelemetry/otlp-exporter-base",
  "node_modules/lighthouse/node_modules/@opentelemetry/otlp-transformer",
  "node_modules/lighthouse/node_modules/@opentelemetry/sdk-logs",
  "node_modules/lighthouse/node_modules/@opentelemetry/sdk-metrics",
];

const missing = requiredEntries.filter((entry) => !lock.includes(entry));
if (missing.length > 0) {
  console.error("verify-package-lock: lockfile missing npm 10 peer entries:");
  for (const entry of missing) {
    console.error(`  - ${entry}`);
  }
  console.error("Fix: npx npm@10.9.8 install --package-lock-only --ignore-scripts");
  process.exit(1);
}

try {
  execSync("npx --yes npm@10.9.8 ci --dry-run --ignore-scripts --no-audit --no-fund", {
    cwd: ROOT,
    stdio: "pipe",
    encoding: "utf8",
  });
} catch (error) {
  const stderr = error?.stderr?.toString?.() ?? "";
  const stdout = error?.stdout?.toString?.() ?? "";
  console.error("verify-package-lock: npm@10.9.8 ci --dry-run failed");
  if (stderr) console.error(stderr);
  if (stdout) console.error(stdout);
  process.exit(1);
}

console.log("package-lock.json OK for npm 10.x (VPS deploy)");
