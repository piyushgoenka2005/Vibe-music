#!/usr/bin/env node
/**
 * Ensure package-lock.json is compatible with npm 10.x (production VPS).
 * npm 12+ can accept a lockfile that npm 10 rejects (missing optional OTEL peers).
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const lockPath = path.join(ROOT, "package-lock.json");

if (!fs.existsSync(lockPath)) {
  console.error("verify-package-lock: package-lock.json missing");
  process.exit(1);
}

const lock = fs.readFileSync(lockPath, "utf8");
const requiredNeedle =
  "node_modules/lighthouse/node_modules/@opentelemetry/exporter-trace-otlp-http";
if (!lock.includes(requiredNeedle) || !lock.includes('"version": "0.222.0"')) {
  console.error(
    "verify-package-lock: lockfile missing lighthouse OTEL peer entries (npm 10 deploy will fail)",
  );
  console.error("Fix: npx npm@10.9.8 install --package-lock-only --ignore-scripts");
  process.exit(1);
}

const npxBin = process.platform === "win32" ? "npx.cmd" : "npx";
const dryRun = spawnSync(
  npxBin,
  [
    "--yes",
    "npm@10.9.8",
    "ci",
    "--dry-run",
    "--ignore-scripts",
    "--no-audit",
    "--no-fund",
  ],
  { cwd: ROOT, encoding: "utf8" },
);

if (dryRun.status !== 0) {
  console.error("verify-package-lock: npm@10.9.8 ci --dry-run failed");
  if (dryRun.stderr) console.error(dryRun.stderr);
  if (dryRun.stdout) console.error(dryRun.stdout);
  process.exit(1);
}

console.log("package-lock.json OK for npm 10.x (VPS deploy)");
