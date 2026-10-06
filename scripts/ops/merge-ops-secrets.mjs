#!/usr/bin/env node
/**
 * Merge deploy/ops-secrets.env into project .env without overwriting existing keys.
 * Legacy store phone values in .env are always upgraded to ops-secrets / canonical phone.
 *
 * Usage:
 *   node scripts/ops/merge-ops-secrets.mjs
 *   MERGE_OVERWRITE_KEYS=NEXT_PUBLIC_GSTIN,NEXT_PUBLIC_LEGAL_ENTITY_NAME node scripts/ops/merge-ops-secrets.mjs
 */
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const targetPath = path.join(root, ".env");
const secretsPath = path.join(root, "deploy", "ops-secrets.env");
const examplePath = path.join(root, "deploy", "ops-secrets.env.example");
const CANONICAL_PHONE = "8910482950";
const LEGACY_PHONE_DIGITS = new Set(["919773651006", "9773651006"]);
const PHONE_KEYS = new Set(["NEXT_PUBLIC_STORE_PHONE", "STORE_PHONE"]);
const META_KEYS = new Set([
  "NEXT_PUBLIC_META_PIXEL_ID",
  "META_CAPI_ACCESS_TOKEN",
  "META_DOMAIN_VERIFICATION",
  "NEXT_PUBLIC_META_DOMAIN_VERIFICATION",
  "META_TEST_EVENT_CODE",
]);

function phoneDigits(raw) {
  return String(raw ?? "").replace(/\D/g, "");
}

function isLegacyPhone(raw) {
  const digits = phoneDigits(raw);
  if (!digits) return false;
  if (LEGACY_PHONE_DIGITS.has(digits)) return true;
  if (digits.length === 12 && digits.startsWith("91")) {
    return LEGACY_PHONE_DIGITS.has(digits.slice(2)) || LEGACY_PHONE_DIGITS.has(digits);
  }
  if (digits.length === 10) {
    return LEGACY_PHONE_DIGITS.has(`91${digits}`);
  }
  return false;
}

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

const overwriteKeys = new Set(
  (process.env.MERGE_OVERWRITE_KEYS ?? "")
    .split(",")
    .map((key) => key.trim())
    .filter(Boolean)
);

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
let overwritten = 0;

const lines = fs.existsSync(targetPath)
  ? fs.readFileSync(targetPath, "utf8").split(/\r?\n/)
  : [];

const keyIndex = new Map();
for (let i = 0; i < lines.length; i += 1) {
  const idx = lines[i].indexOf("=");
  if (idx > 0) keyIndex.set(lines[i].slice(0, idx).trim(), i);
}

function setLine(key, value) {
  const line = `${key}=${value}`;
  if (keyIndex.has(key)) {
    lines[keyIndex.get(key)] = line;
  } else {
    lines.push(line);
    keyIndex.set(key, lines.length - 1);
  }
}

for (const [key, value] of incoming) {
  const current = existing.get(key);
  const forceOverwrite = overwriteKeys.has(key) || META_KEYS.has(key);
  const legacyPhone = PHONE_KEYS.has(key) && isLegacyPhone(current);
  const emptyCurrent = !current?.trim();

  if (current && !forceOverwrite && !legacyPhone && !emptyCurrent) {
    skipped += 1;
    continue;
  }

  if (current && (forceOverwrite || legacyPhone)) {
    overwritten += 1;
  } else {
    merged += 1;
  }
  setLine(key, value);
  existing.set(key, value);
}

// Ensure canonical phone when secrets omit phone but .env still has legacy values.
for (const key of PHONE_KEYS) {
  const current = existing.get(key);
  if (isLegacyPhone(current)) {
    setLine(key, incoming.get(key) || CANONICAL_PHONE);
    overwritten += 1;
    existing.set(key, incoming.get(key) || CANONICAL_PHONE);
  }
}

if (merged > 0 || overwritten > 0) {
  fs.writeFileSync(targetPath, `${lines.join("\n").replace(/\n*$/, "\n")}`);
}

console.log(
  `Merged ${merged} key(s), overwrote ${overwritten} key(s) from deploy/ops-secrets.env (${skipped} skipped — already set).`
);
