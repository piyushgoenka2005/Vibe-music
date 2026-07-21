#!/usr/bin/env node
/**
 * Merge deploy/ops-secrets.env into project .env without overwriting existing keys.
 * Usage: node scripts/ops/merge-ops-secrets.mjs
 */
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const targetPath = path.join(root, ".env");
const secretsPath = path.join(root, "deploy", "ops-secrets.env");
const examplePath = path.join(root, "deploy", "ops-secrets.env.example");

function parseEnv(text) {
  const out = new Map();
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx <= 0) continue;
    const key = trimmed.slice(0, idx).trim();
    const value = trimmed.slice(idx + 1).trim();
    if (value) out.set(key, value);
  }
  return out;
}

function loadFile(filePath) {
  if (!fs.existsSync(filePath)) return new Map();
  return parseEnv(fs.readFileSync(filePath, "utf8"));
}

if (!fs.existsSync(secretsPath)) {
  console.log("No deploy/ops-secrets.env found — skipping merge.");
  if (fs.existsSync(examplePath)) {
    console.log("Copy deploy/ops-secrets.env.example → deploy/ops-secrets.env and fill values.");
  }
  process.exit(0);
}

const existing = loadFile(targetPath);
const incoming = loadFile(secretsPath);
let merged = 0;
let skipped = 0;

const lines = fs.existsSync(targetPath)
  ? fs.readFileSync(targetPath, "utf8").split(/\r?\n/)
  : [];

const presentKeys = new Set(
  lines
    .map((line) => {
      const idx = line.indexOf("=");
      return idx > 0 ? line.slice(0, idx).trim() : null;
    })
    .filter(Boolean)
);

for (const [key, value] of incoming) {
  if (presentKeys.has(key) && existing.get(key)) {
    skipped += 1;
    continue;
  }
  lines.push(`${key}=${value}`);
  merged += 1;
}

if (merged > 0) {
  fs.writeFileSync(targetPath, `${lines.join("\n").replace(/\n*$/, "\n")}`);
}

console.log(`Merged ${merged} key(s) from deploy/ops-secrets.env into .env (${skipped} skipped — already set).`);
