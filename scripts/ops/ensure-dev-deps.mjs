#!/usr/bin/env node
/**
 * Fail fast before `npm run dev` when node_modules is corrupt or Node is unsupported.
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

const required = [
  "node_modules/next/package.json",
  "node_modules/next/dist/bin/next",
  "node_modules/@swc/helpers/package.json",
  "node_modules/.bin/next.cmd",
  "node_modules/.bin/next",
];

const missing = required.filter((rel) => !fs.existsSync(path.join(ROOT, rel)));

const major = Number(process.versions.node.split(".")[0]);
const nodeOk = major >= 20 && major < 23;

if (!nodeOk) {
  console.warn("");
  console.warn(`WARN: Node ${process.version} is outside the supported range (>=20.19 <23).`);
  console.warn("Install Node 22 LTS (https://nodejs.org or nvm-windows) and run: npm run reinstall:deps");
  console.warn("");
}

if (missing.length > 0) {
  console.error("");
  console.error("Dependencies are missing or corrupt (common on Windows after interrupted npm install):");
  for (const rel of missing) {
    console.error(`  - ${rel}`);
  }
  console.error("");
  console.error("Fix:");
  console.error("  npm run reinstall:deps");
  console.error("  npm run dev");
  console.error("");
  process.exit(1);
}

const verify = spawnSync(process.execPath, ["scripts/ops/verify/verify-node-modules.mjs"], {
  cwd: ROOT,
  stdio: "inherit",
});

process.exit(verify.status ?? 1);
