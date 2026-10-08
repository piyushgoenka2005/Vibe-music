#!/usr/bin/env node
/**
 * CI gate — banned stale/inconsistent storefront copy must not ship.
 * Usage: npm run verify:storefront-copy
 */
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const srcDir = path.join(root, "src");

const BANNED = [
  { pattern: /free shipping on orders above/i, reason: "Use SHIPPING_POLICY — free on every order" },
  { pattern: /free shipping on orders over/i, reason: "Use SHIPPING_POLICY — free on every order" },
  { pattern: /free shipping on qualifying orders/i, reason: "Use SHIPPING_POLICY.cartBanner" },
  { pattern: /10K\+?\s*products/i, reason: "Stale catalogue claim" },
  { pattern: /24\/7|24×7/i, reason: "Support is Mon–Sat per businessIdentity" },
  { pattern: /Room 310|Room 311/i, reason: "Use CANONICAL_BUSINESS_ADDRESS (Room 303)" },
  {
    pattern: /from our Maharashtra warehouse|dispatched from our Maharashtra/i,
    reason: "Dispatch from CANONICAL_BUSINESS_ADDRESS (Kolkata)",
  },
  {
    pattern: /Fender Stratocaster|QSC live sound/i,
    reason: "Use catalogue-aligned alt text — no brands we do not sell",
  },
];

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "node_modules" || entry.name === ".next") continue;
      walk(full, files);
    } else if (/\.(tsx?|jsx?|md)$/.test(entry.name) && !/\.test\.(tsx?|jsx?)$/.test(entry.name)) {
      files.push(full);
    }
  }
  return files;
}

/** Canonical shipping copy builder — may contain threshold-based phrases by design. */
const ALLOWLIST = new Set(["src/lib/storefront/shippingPolicy.ts"]);

const violations = [];
for (const file of walk(srcDir)) {
  const rel = path.relative(root, file).replaceAll("\\", "/");
  if (ALLOWLIST.has(rel)) continue;
  const text = fs.readFileSync(file, "utf8");
  for (const ban of BANNED) {
    if (ban.pattern.test(text)) {
      violations.push({ file: path.relative(root, file), reason: ban.reason });
    }
  }
}

if (violations.length) {
  console.error("\nStorefront copy verification FAILED:\n");
  for (const v of violations) {
    console.error(`  ${v.file} — ${v.reason}`);
  }
  console.error("");
  process.exit(1);
}

console.log("Storefront copy verification OK.");
process.exit(0);
