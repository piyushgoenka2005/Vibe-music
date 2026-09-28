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

const repoCode = run("Engineering program", "npm", ["run", "verify:engineering"]);
const deployCode = run("Deploy sync status", "npm", ["run", "phase8:status"]);

let liveCode = 0;
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

  const edgeCode = run("Edge probe (L-22)", "npm", ["run", "check:edge"]);
  if (edgeCode !== 0) {
    console.log("\nℹ L-22: Cloudflare proxied DNS required — see docs/ops/PHASE10_EDGE_SECURITY.md");
  }
  const complianceEnv = {
    ...process.env,
    VERIFY_BASE_URL,
    REQUIRE_COMPLIANCE: "true",
  };
  const compliance = spawnSync("npx", ["tsx", "scripts/ops/prod-signoff.mts"], {
    stdio: "inherit",
    shell: process.platform === "win32",
    env: complianceEnv,
  });
  const complianceCode = compliance.status ?? 1;
  console.log(
    complianceCode === 0
      ? "✓ Compliance strict (L-30)"
      : `✗ Compliance strict (L-30) (exit ${complianceCode})`,
  );
  if (complianceCode !== 0) {
    console.log("\nℹ L-30: Set GSTIN on VPS — bash deploy/apply-compliance.sh");
  }
} else {
  console.log("\nℹ Set VERIFY_BASE_URL for live probes.");
}

console.log("\n───────────────────────────────────────────────────────────");
console.log("Operator steps (VPS console as root):");
console.log(
  "  curl -fsSL https://raw.githubusercontent.com/piyushgoenka2005/Vibe-music/main/deploy/install-deploy-key.sh | bash",
);
console.log("Then GitHub secret VPS_SSH_KEY → Actions → Deploy production");
console.log("Or on VPS:");
console.log("  cd ~/Vibe-music && git pull origin main && bash deploy/update.sh");
console.log("  bash deploy/certify-production.sh");
console.log("  CLOUDFLARE_ONLY=1 bash deploy/certify-production.sh");
console.log("───────────────────────────────────────────────────────────\n");

const failed = [repoCode, deployCode, liveCode].filter((code) => code !== 0);
if (failed.length === 0) {
  console.log("✅ Go-live verification PASSED — target 20/20 when edge + compliance green.");
} else {
  console.error(`✗ ${failed.length} gate(s) need operator action (see above).`);
}

process.exit(failed.length ? 1 : 0);
