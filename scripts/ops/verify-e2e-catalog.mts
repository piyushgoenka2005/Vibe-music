#!/usr/bin/env npx tsx
/**
 * L-26 merge gate — ensure every critical audit E2E case is registered in Playwright.
 *
 * Usage:
 *   npm run verify:e2e-catalog
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const catalogPath = path.join(process.cwd(), "docs", "ops", "e2e-audit-catalog.json");

interface CatalogEntry {
  id: string;
  finding: string;
  pattern: string;
}

interface CatalogFile {
  mergeGate: CatalogEntry[];
}

function loadCatalog(): CatalogFile {
  const raw = fs.readFileSync(catalogPath, "utf8");
  return JSON.parse(raw) as CatalogFile;
}

function listPlaywrightTests(): string {
  const result = spawnSync("npx", ["playwright", "test", "--list"], {
    encoding: "utf8",
    shell: process.platform === "win32",
    env: process.env,
  });
  if (result.status !== 0) {
    console.error(result.stderr || result.stdout);
    throw new Error("playwright test --list failed");
  }
  return result.stdout;
}

function main(): void {
  const catalog = loadCatalog();
  const listing = listPlaywrightTests();
  const lines = listing.split(/\r?\n/);

  const missing: CatalogEntry[] = [];
  for (const entry of catalog.mergeGate) {
    const found = lines.some((line) => line.includes(entry.pattern));
    if (!found) missing.push(entry);
  }

  const totalTestsMatch = listing.match(/Total:\s+(\d+)\s+tests/i);
  const totalTests = totalTestsMatch ? Number(totalTestsMatch[1]) : lines.length;

  console.log(`Playwright suite: ${totalTests} tests`);
  console.log(
    `Merge gate catalog: ${catalog.mergeGate.length - missing.length}/${catalog.mergeGate.length} critical cases mapped`,
  );

  if (missing.length) {
    console.error("\nMissing critical E2E cases (update Playwright or catalog):");
    for (const entry of missing) {
      console.error(`  ✗ ${entry.id} (${entry.finding}): "${entry.pattern}"`);
    }
    process.exit(1);
  }

  console.log("\nE2E audit catalog merge gate passed.");
}

main();
