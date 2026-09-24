#!/usr/bin/env npx tsx
/**
 * One-shot release readiness gate (local CI + optional production sign-off).
 *
 * Usage:
 *   npm run release:ready
 *   VERIFY_BASE_URL=https://vibemusic.in npm run release:ready
 */
import { spawnSync } from "node:child_process";

const VERIFY_BASE_URL = (process.env.VERIFY_BASE_URL ?? "").replace(/\/$/, "");

function run(label: string, command: string, args: string[], env?: Record<string, string>): boolean {
  console.log(`\n▶ ${label}`);
  const result = spawnSync(command, args, {
    stdio: "inherit",
    shell: process.platform === "win32",
    env: { ...process.env, ...env },
  });
  if (result.status !== 0) {
    console.error(`\n✗ ${label} failed (exit ${result.status ?? 1})`);
    return false;
  }
  console.log(`✓ ${label}`);
  return true;
}

console.log("═══════════════════════════════════════════════════════════");
console.log("  Vibe Music — release readiness");
console.log("═══════════════════════════════════════════════════════════");

const steps: Array<[string, string, string[], Record<string, string>?]> = [
  ["TypeScript", "npm", ["run", "type-check"]],
  ["ESLint", "npm", ["run", "lint"]],
  ["Unit tests", "npm", ["test"]],
  ["Production build", "npm", ["run", "build"], { ALLOW_POSTGRES_DURING_BUILD: "true" }],
];

let ok = true;
for (const [label, cmd, args, env] of steps) {
  if (!run(label, cmd, args, env)) {
    ok = false;
    break;
  }
}

if (!ok) {
  process.exit(1);
}

if (VERIFY_BASE_URL) {
  if (
    !run("Production sign-off", "npx", ["tsx", "scripts/ops/prod-signoff.mts"], {
      VERIFY_BASE_URL,
    })
  ) {
    process.exit(1);
  }
} else {
  console.log(`
ℹ Skipping remote sign-off (set VERIFY_BASE_URL=https://vibemusic.in to include).

After deploy on VPS:
  cd /root/Vibe-music && git pull origin main && bash deploy/update.sh
  VERIFY_BASE_URL=https://vibemusic.in npm run verify:prod-signoff
  BASE_URL=https://vibemusic.in bash deploy/post-deploy-smoke.sh
`);
}

console.log("\n✅ Release readiness PASSED — safe to deploy `main` to production.\n");
