#!/usr/bin/env node
/**
 * Fail fast when node_modules is partial/corrupt (common after interrupted npm ci on VPS).
 * Used by deploy/update.sh and deploy/repair-deps.sh.
 */
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

const requiredPaths = [
  "node_modules/next/package.json",
  "node_modules/next/dist/bin/next",
  "node_modules/next/dist/compiled/jest-worker/processChild.js",
  "node_modules/@swc/helpers/package.json",
  "node_modules/@next/env/package.json",
];

const missing = requiredPaths.filter((rel) => !fs.existsSync(path.join(root, rel)));

if (missing.length > 0) {
  console.error("Corrupt or partial node_modules — missing:");
  for (const rel of missing) {
    console.error(`  - ${rel}`);
  }
  console.error("");
  console.error("Recovery on VPS:");
  console.error("  pm2 stop vibe vibe-worker");
  console.error("  bash deploy/repair-deps.sh");
  process.exit(1);
}

const nextPkg = JSON.parse(
  fs.readFileSync(path.join(root, "node_modules/next/package.json"), "utf8"),
);
console.log(`node_modules OK (next@${nextPkg.version})`);
