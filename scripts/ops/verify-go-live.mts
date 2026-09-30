#!/usr/bin/env npx tsx
/**
 * Go-live track gate (Phases 8–10) — deploy sync + operator checklist.
 *
 *   npm run verify:go-live
 *   VERIFY_BASE_URL=https://vibemusic.in npm run verify:go-live
 */
import { spawnSync } from "node:child_process";

const VERIFY_BASE_URL = (process.env.VERIFY_BASE_URL ?? "https://vibemusic.in").replace(
  /\/$/,
  "",
);

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
console.log("  Vibe Music — go-live verification (Phases 8–10)");
console.log("═══════════════════════════════════════════════════════════");

// Go-live is an operator gate — use audit remediation, not full engineering CI
// (coverage + integration tests belong on dev/CI, not on the production VPS).
const repoCode = run("Repository audit gate", "npm", ["run", "verify:audit"]);
const deployCode = run("Deploy sync (Phase 8)", "npm", ["run", "verify:phase8"]);

let liveCode = 0;
let edgeCode = 0;
let complianceCode = 0;
if (VERIFY_BASE_URL) {
  const signoffEnv = { ...process.env, VERIFY_BASE_URL };
  console.log("\n▶ Production sign-off");
  const signoff = spawnSync("npx", ["tsx", "scripts/ops/prod-signoff.mts"], {
    stdio: "inherit",
    shell: process.platform === "win32",
    env: signoffEnv,
  });
  liveCode = signoff.status ?? 1;
  console.log(liveCode === 0 ? "✓ Production sign-off" : `✗ Production sign-off (exit ${liveCode})`);

  edgeCode = run("Edge security (Phase 10)", "npm", ["run", "verify:phase10"]);
  if (edgeCode !== 0) {
    console.log("\nℹ L-22/L-23: CloudOnFire nginx + UFW — see README.md");
  }
  complianceCode = run("Compliance live (Phase 9)", "npm", ["run", "verify:phase9"]);
  if (complianceCode !== 0) {
    console.log("\nℹ L-30: Set GSTIN on VPS — bash deploy/production.sh compliance");
  }
} else {
  console.log("\nℹ Set VERIFY_BASE_URL for live probes.");
}

console.log("\n───────────────────────────────────────────────────────────");
console.log("Operator steps (VPS console as root):");
console.log("  Configure VPS_SSH_KEY in GitHub Actions (see scripts/ops/setup-deploy-access.ps1)");
console.log("Or on VPS:");
console.log("  cd ~/Vibe-music && git pull origin main && bash deploy/update.sh");
console.log("  bash deploy/production.sh certify");
console.log("  LOCKDOWN_UFW=1 bash deploy/production.sh certify");
console.log("───────────────────────────────────────────────────────────\n");

const failed = [repoCode, deployCode, liveCode, edgeCode, complianceCode].filter(
  (code) => code !== 0,
);
if (failed.length === 0) {
  console.log("✅ Go-live verification PASSED — target 20/20 when edge + compliance green.");
} else {
  console.error(`✗ ${failed.length} gate(s) need operator action (see above).`);
}

process.exit(failed.length ? 1 : 0);
