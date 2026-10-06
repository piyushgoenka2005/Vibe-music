#!/usr/bin/env npx tsx
/** Print GSTIN env validity without logging the full value. */
import fs from "node:fs";

const GSTIN_PATTERN = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][0-9A-Z]Z[0-9A-Z]$/;
const envPath = process.argv[2] ?? ".env";
const raw = fs.existsSync(envPath) ? fs.readFileSync(envPath, "utf8") : "";
const line = raw.split(/\r?\n/).find((l) => l.startsWith("NEXT_PUBLIC_GSTIN=")) ?? "";
const value = line
  .split("=")
  .slice(1)
  .join("=")
  .trim()
  .replace(/^["']|["']$/g, "");

console.log(
  JSON.stringify({
    len: value.length,
    valid: GSTIN_PATTERN.test(value),
    empty: value.length === 0,
  }),
);
