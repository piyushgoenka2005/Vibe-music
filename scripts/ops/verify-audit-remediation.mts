#!/usr/bin/env npx tsx
/**
 * Full repository audit remediation gate (Phases 0–10 code completeness).
 *
 * Usage:
 *   npm run verify:audit
 *   VERIFY_BASE_URL=https://vibemusic.in npm run verify:audit
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

type Step = { name: string; cmd: string; args: string[]; optional?: boolean };

const VERIFY_BASE_URL = (process.env.VERIFY_BASE_URL ?? "").replace(/\/$/, "");

const REPO_STEPS: Step[] = [
  { name: "Unit tests", cmd: "npm", args: ["test"] },
  { name: "TypeScript", cmd: "npm", args: ["run", "type-check"] },
  { name: "ESLint", cmd: "npm", args: ["run", "lint"] },
  { name: "Dependency audit (L-20)", cmd: "npm", args: ["run", "audit:deps"] },
  { name: "E2E catalog gate (L-26)", cmd: "npm", args: ["run", "verify:e2e-catalog"] },
];

const ARTIFACTS = [
  "docs/audit/vibemusic_audit.json",
  "docs/ops/PRODUCTION_READINESS_SCORECARD.md",
  "docs/ops/e2e-audit-catalog.json",
  "deploy/complete-audit-go-live.sh",
  "deploy/apply-compliance.sh",
  "scripts/ops/synthetic-checkout-monitor.mts",
];

function runStep(step: Step): boolean {
  const result = spawnSync(step.cmd, step.args, {
    stdio: "inherit",
    shell: process.platform === "win32",
    env: process.env,
  });
  const ok = result.status === 0;
  console.log(ok ? `✅ ${step.name}` : step.optional ? `⚠️  ${step.name} (optional)` : `❌ ${step.name}`);
  return ok || Boolean(step.optional);
}

console.log("\n═══ Vibe Music — audit remediation verification (repository) ═══\n");

let ok = true;
for (const step of REPO_STEPS) {
  if (!runStep(step)) ok = false;
}

console.log("\nArtifacts:");
for (const file of ARTIFACTS) {
  const exists = fs.existsSync(path.join(process.cwd(), file));
  console.log(`${exists ? "✅" : "❌"} ${file}`);
  if (!exists) ok = false;
}

if (VERIFY_BASE_URL) {
  console.log(`\nLive probes (${VERIFY_BASE_URL}):`);
  const liveSteps: Step[] = [
    { name: "prod-signoff", cmd: "npm", args: ["run", "verify:prod-signoff"] },
    { name: "check:edge (L-22)", cmd: "npm", args: ["run", "check:edge"], optional: true },
    {
      name: "compliance strict (L-30)",
      cmd: "npm",
      args: ["run", "verify:prod-signoff"],
      optional: true,
    },
    { name: "readiness scorecard", cmd: "npm", args: ["run", "verify:readiness"], optional: true },
  ];
  const env = { ...process.env, VERIFY_BASE_URL, REQUIRE_COMPLIANCE: "true" };
  for (const step of liveSteps) {
    const result = spawnSync(step.cmd, step.args, {
      stdio: "inherit",
      shell: process.platform === "win32",
      env: step.name.includes("compliance") ? env : { ...process.env, VERIFY_BASE_URL },
    });
    const passed = result.status === 0;
    console.log(`${passed ? "✅" : step.optional ? "⚠️" : "❌"} ${step.name}`);
    if (!passed && !step.optional) ok = false;
  }
} else {
  console.log("\nℹ Set VERIFY_BASE_URL=https://vibemusic.in to include live production probes.");
}

console.log(ok ? "\n✅ Repository audit remediation PASSED.\n" : "\n❌ Audit remediation gate FAILED.\n");
process.exit(ok ? 0 : 1);
