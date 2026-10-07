#!/usr/bin/env node
/**
 * Normalize production .env on the VPS (safe, idempotent).
 * - Replaces legacy store phone with canonical 8910482950
 * - Ensures TRUST_PROXY_HOPS=1 behind nginx on CloudOnFire VPS
 *
 * Usage: node scripts/ops/normalize-production-env.mjs
 */
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const envPath = path.join(root, ".env");
const localEnvPath = path.join(root, ".env.local");
const CANONICAL_PHONE = "8910482950";
const LEGACY_PHONE_DIGITS = new Set(["919773651006", "9773651006"]);
const PHONE_KEYS = new Set(["NEXT_PUBLIC_STORE_PHONE", "STORE_PHONE"]);

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

function upsertKey(lines, key, value) {
  const prefix = `${key}=`;
  let found = false;
  const next = lines.map((line) => {
    if (!line.startsWith(prefix)) return line;
    found = true;
    return `${key}=${value}`;
  });
  if (!found) next.push(`${key}=${value}`);
  return next;
}

if (!fs.existsSync(envPath)) {
  console.log("No .env file — skipping normalize-production-env.");
  process.exit(0);
}

const original = fs.readFileSync(envPath, "utf8");
let lines = original.split(/\r?\n/);
let phoneFixed = 0;

for (const key of PHONE_KEYS) {
  const prefix = `${key}=`;
  lines = lines.map((line) => {
    if (!line.startsWith(prefix)) return line;
    const value = line.slice(prefix.length).trim();
    if (!isLegacyPhone(value)) return line;
    phoneFixed += 1;
    return `${key}=${CANONICAL_PHONE}`;
  });
}

const hasTrustProxy = lines.some((line) => line.startsWith("TRUST_PROXY_HOPS="));
if (!hasTrustProxy) {
  lines.push("TRUST_PROXY_HOPS=1");
}

// Storefront policy: free shipping on every order — remove legacy threshold env.
lines = lines.filter((line) => !line.startsWith("NEXT_PUBLIC_CART_FREE_SHIPPING_THRESHOLD="));

const normalized = `${lines.join("\n").replace(/\n*$/, "\n")}`;
if (normalized !== original) {
  fs.writeFileSync(envPath, normalized);
}

if (phoneFixed > 0) {
  console.log(`Normalized ${phoneFixed} legacy store phone value(s) → ${CANONICAL_PHONE}`);
} else {
  console.log("Store phone OK (no legacy numbers in .env).");
}
if (!hasTrustProxy) {
  console.log("Appended TRUST_PROXY_HOPS=1.");
}

// .env.local overrides .env in production — stale secrets there break OAuth + Razorpay.
if (fs.existsSync(localEnvPath)) {
  const localOriginal = fs.readFileSync(localEnvPath, "utf8");
  const localFiltered = localOriginal
    .split(/\r?\n/)
    .filter((line) => {
      const trimmed = line.trim();
      return (
        !/^AUTH_GOOGLE_(ID|SECRET)=/.test(trimmed) &&
        !/^RAZORPAY_/.test(trimmed) &&
        !/^NEXT_PUBLIC_RAZORPAY_KEY_ID=/.test(trimmed) &&
        !/^ALLOW_DEMO_PAYMENTS=/.test(trimmed)
      );
    })
    .join("\n");
  if (localFiltered !== localOriginal) {
    fs.writeFileSync(
      localEnvPath,
      localFiltered.endsWith("\n") ? localFiltered : `${localFiltered}\n`,
    );
    console.log(
      "Removed stale AUTH_GOOGLE_* / RAZORPAY_* / ALLOW_DEMO_PAYMENTS from .env.local (use .env / ops-secrets on VPS).",
    );
  }
}
