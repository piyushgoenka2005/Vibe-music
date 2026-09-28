#!/usr/bin/env npx tsx
/**
 * One report of repo + env configuration completeness (no secrets printed).
 *
 * Usage:
 *   npm run ops:configuration-status
 *   STRICT_COMPLIANCE=true npm run ops:configuration-status
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
console.log("  Vibe Music — configuration status");
console.log("═══════════════════════════════════════════════════════════");

const results: Array<{ label: string; code: number; blocking: boolean }> = [
  {
    label: "Env keys (check:env)",
    code: run("Env keys", "npm", ["run", "check:env"]),
    blocking: true,
  },
  {
    label: "Storefront copy consistency",
    code: run("Storefront copy", "npm", ["run", "verify:storefront-copy"]),
    blocking: true,
  },
  {
    label: "Audit remediation gates",
    code: run("Audit remediation", "npm", ["run", "verify:audit"]),
    blocking: true,
  },
  {
    label: "Gear story MP4s (origin/CDN)",
    code: run("Gear story videos", "npm", ["run", "verify:gear-videos"]),
    blocking: process.env.VERIFY_GEAR_VIDEOS_STRICT === "true",
  },
];

const failedBlocking = results.filter((row) => row.blocking && row.code !== 0);
const failedOptional = results.filter((row) => !row.blocking && row.code !== 0);

console.log("\n───────────────────────────────────────────────────────────");
console.log("Operator-only (not verifiable from repo):");
console.log("  • Cloudflare proxied DNS + cf-ray (L-22)");
console.log("  • UFW Cloudflare-only origin lockdown (L-23)");
console.log("  • NEXT_PUBLIC_GSTIN on production VPS + rebuild (L-30)");
console.log("  • Optional channels: MSG91, WhatsApp Cloud, VAPID, Crisp, Upstash");
console.log("  • Upload gear-story MP4s to CDN or public/videos/style-story/");
console.log("───────────────────────────────────────────────────────────\n");

if (failedBlocking.length) {
  console.error(`${failedBlocking.length} blocking configuration check(s) failed.\n`);
  process.exit(1);
}

if (failedOptional.length) {
  console.log(
    `${failedOptional.length} optional check(s) incomplete — see details above.\n`,
  );
} else {
  console.log("All automated configuration checks passed.\n");
}

process.exit(0);
