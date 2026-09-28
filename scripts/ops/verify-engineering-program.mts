#!/usr/bin/env npx tsx
/**
 * Full engineering program gate — run before tagging a release or merging major work.
 *
 *   npm run verify:engineering
 *   DATABASE_URL=... npm run verify:engineering   # includes integration tests
 */
import { spawnSync } from "node:child_process";

function run(label: string, command: string, args: string[]): number {
  console.log(`\n▶ ${label}`);
  const result = spawnSync(command, args, {
    stdio: "inherit",
    shell: process.platform === "win32",
    env: process.env,
  });
  const code = result.status ?? 1;
  console.log(code === 0 ? `✓ ${label}` : `✗ ${label} (exit ${code})`);
  return code;
}

console.log("═══════════════════════════════════════════════════════════");
console.log("  Vibe Music — engineering program verification (Phases 0–6)");
console.log("═══════════════════════════════════════════════════════════");

const steps: Array<{ label: string; code: number }> = [
  { label: "Type check", code: run("Type check", "npm", ["run", "type-check"]) },
  { label: "Lint", code: run("Lint", "npm", ["run", "lint"]) },
  { label: "Unit tests", code: run("Unit tests", "npm", ["test"]) },
  {
    label: "Critical-path coverage",
    code: run("Coverage gate", "npm", ["run", "test:coverage:gate"]),
  },
];

if (process.env.DATABASE_URL?.trim()) {
  steps.push({
    label: "Database migrations",
    code: run("DB migrate", "npm", ["run", "db:migrate"]),
  });
  steps.push({
    label: "Integration tests",
    code: run("Integration tests", "npm", ["run", "test:integration"]),
  });
} else {
  console.log("\nℹ DATABASE_URL unset — skipping integration tests");
}

steps.push({
  label: "Repository completeness",
  code: run("Verify complete", "npm", ["run", "verify:complete"]),
});

const failed = steps.filter((row) => row.code !== 0);

console.log("\n───────────────────────────────────────────────────────────");
if (failed.length === 0) {
  console.log("✅ Engineering program verification PASSED.");
  console.log("   VPS go-live: bash deploy/certify-production.sh");
} else {
  console.error(`✗ ${failed.length} step(s) failed.`);
}
console.log("───────────────────────────────────────────────────────────\n");

process.exit(failed.length ? 1 : 0);
