#!/usr/bin/env npx tsx
/**
 * Master repository completeness gate — run before any production deploy.
 *
 * Usage:
 *   npm run verify:complete
 *   VERIFY_BASE_URL=https://vibemusic.in npm run verify:complete
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
console.log("  Vibe Music — verify complete (repository final gate)");
console.log("═══════════════════════════════════════════════════════════");

const steps: Array<{ label: string; code: number; blocking: boolean }> = [
  {
    label: "Storefront copy consistency",
    code: run("Storefront copy", "npm", ["run", "verify:storefront-copy"]),
    blocking: true,
  },
  {
    label: "Audit remediation (L-01 → L-30)",
    code: run("Audit remediation", "npm", ["run", "verify:audit"]),
    blocking: true,
  },
  {
    label: "Configuration status",
    code: run("Configuration status", "npm", ["run", "ops:configuration-status"]),
    blocking: false,
  },
];

const VERIFY_BASE_URL = (process.env.VERIFY_BASE_URL ?? "").replace(/\/$/, "");
if (VERIFY_BASE_URL) {
  steps.push({
    label: `Production sign-off (${VERIFY_BASE_URL})`,
    code: run("Production sign-off", "npx", [
      "tsx",
      "scripts/ops/prod-signoff.mts",
    ]),
    blocking: false,
  });
  steps.push({
    label: "Live readiness scorecard",
    code: run("Readiness scorecard", "npm", ["run", "verify:readiness"]),
    blocking: false,
  });
}

const failedBlocking = steps.filter((row) => row.blocking && row.code !== 0);
const failedOptional = steps.filter((row) => !row.blocking && row.code !== 0);

console.log("\n───────────────────────────────────────────────────────────");
if (failedBlocking.length === 0) {
  console.log("✅ Repository completeness PASSED — safe to deploy to production.");
} else {
  console.error(`✗ ${failedBlocking.length} blocking gate(s) failed.`);
}
if (failedOptional.length) {
  console.log(`ℹ ${failedOptional.length} optional probe(s) incomplete (env/VPS).`);
}
if (!VERIFY_BASE_URL) {
  console.log("ℹ Set VERIFY_BASE_URL=https://vibemusic.in to include live probes.");
}
console.log("   VPS final step: bash deploy/certify-production.sh");
console.log("───────────────────────────────────────────────────────────\n");

process.exit(failedBlocking.length ? 1 : 0);
