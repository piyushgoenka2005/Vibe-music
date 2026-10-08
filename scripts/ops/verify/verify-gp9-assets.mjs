#!/usr/bin/env node
/**
 * Verify self-hosted GP-9 assets exist (run after download:gp9-assets).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { GP9_PUBLIC_ROOT, GP9_REQUIRED_FILES } from "../../assets/gp9-asset-manifest.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const base = path.join(ROOT, "public", GP9_PUBLIC_ROOT);

const missing = GP9_REQUIRED_FILES.filter((rel) => !fs.existsSync(path.join(base, rel)));

if (missing.length > 0) {
  console.error("Missing GP-9 assets:");
  for (const rel of missing) {
    console.error(`  public/${GP9_PUBLIC_ROOT}/${rel}`);
  }
  console.error("\nRun: npm run download:gp9-assets");
  process.exit(1);
}

console.log(`GP-9 assets OK (${GP9_REQUIRED_FILES.length} required files in public/${GP9_PUBLIC_ROOT}/)`);
