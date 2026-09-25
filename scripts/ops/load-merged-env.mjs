/**
 * Load merged env files the same way as scripts/ops/check-env.mjs.
 * Later files override earlier: .env → .env.local → .env.production → .env.production.local
 */
import fs from "node:fs";
import path from "node:path";

export const MERGED_ENV_FILES = [
  ".env",
  ".env.local",
  ".env.production",
  ".env.production.local",
];

function parseEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const out = {};
  for (const line of fs.readFileSync(filePath, "utf8").split(/\r?\n/)) {
    if (!line || line.trimStart().startsWith("#")) continue;
    const idx = line.indexOf("=");
    if (idx <= 0) continue;
    const key = line.slice(0, idx).trim();
    let value = line.slice(idx + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    out[key] = value;
  }
  return out;
}

export function loadEnvRecord(root = process.cwd()) {
  const merged = {};
  for (const file of MERGED_ENV_FILES) {
    Object.assign(merged, parseEnvFile(path.join(root, file)));
  }
  return merged;
}

/** Apply merged env to process.env (later files win). */
export function applyMergedEnvToProcess(root = process.cwd()) {
  const merged = loadEnvRecord(root);
  for (const [key, value] of Object.entries(merged)) {
    process.env[key] = value;
  }
  return merged;
}

const invokedDirectly = process.argv[1]?.replace(/\\/g, "/").includes("load-merged-env.mjs");
if (invokedDirectly) {
  const flag = process.argv[2];
  const merged = loadEnvRecord();

  if (flag === "--get" && process.argv[3]) {
    process.stdout.write(merged[process.argv[3]] ?? "");
    process.exit(0);
  }

  if (flag === "--apply") {
    applyMergedEnvToProcess();
    process.exit(0);
  }

  console.error("Usage: node scripts/ops/load-merged-env.mjs --get KEY");
  process.exit(1);
}
