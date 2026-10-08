#!/usr/bin/env npx tsx
/**
 * Verify Razorpay checkout readiness on vibemusic.in (no charge).
 *
 * Usage:
 *   npx tsx scripts/ops/verify/verify-razorpay-prod.mts
 *   SITE_URL=https://vibemusic.in npx tsx scripts/ops/verify/verify-razorpay-prod.mts
 */
const SITE_URL = (process.env.SITE_URL ?? "https://vibemusic.in").replace(/\/$/, "");

type Capabilities = {
  razorpayConfigured?: boolean;
  razorpayMode?: string;
  razorpayIssue?: string | null;
  onlinePaymentsAvailable?: boolean;
  demoPaymentsAllowed?: boolean;
};

async function fetchCapabilities(): Promise<Capabilities> {
  const response = await fetch(`${SITE_URL}/api/checkout/capabilities`, {
    headers: { Accept: "application/json" },
  });
  if (!response.ok) {
    throw new Error(`capabilities HTTP ${response.status}`);
  }
  return (await response.json()) as Capabilities;
}

async function main() {
  console.log(`\nVibe Music — Razorpay production check (${SITE_URL})\n`);

  let caps: Capabilities;
  try {
    caps = await fetchCapabilities();
  } catch (error) {
    console.error("FAIL  checkout/capabilities", error instanceof Error ? error.message : error);
    process.exit(1);
  }

  const checks = [
    {
      name: "razorpayConfigured",
      ok: caps.razorpayConfigured === true,
      detail: caps.razorpayConfigured ? "true" : "false",
      blocking: true,
    },
    {
      name: "onlinePaymentsAvailable",
      ok: caps.onlinePaymentsAvailable === true,
      detail: caps.onlinePaymentsAvailable ? "true" : "false",
      blocking: true,
    },
    {
      name: "razorpayMode",
      ok: caps.razorpayMode === "live",
      detail: caps.razorpayMode ?? "unknown",
      blocking: true,
    },
    {
      name: "demoPaymentsAllowed",
      ok: caps.demoPaymentsAllowed !== true,
      detail: String(caps.demoPaymentsAllowed ?? false),
      blocking: true,
    },
    {
      name: "razorpayIssue",
      ok: !caps.razorpayIssue,
      detail: caps.razorpayIssue ?? "none",
      blocking: Boolean(caps.razorpayIssue),
    },
  ];

  for (const check of checks) {
    const mark = check.ok ? "OK  " : check.blocking ? "FAIL" : "WARN";
    console.log(`${mark}  ${check.name.padEnd(26)} ${check.detail}`);
  }

  const failed = checks.filter((c) => !c.ok && c.blocking);
  if (failed.length > 0) {
    console.log(`
Production Razorpay is not ready.
1. Run locally:  npm run setup:razorpay-integration
2. Sync to VPS:  npm run ops:sync-razorpay-vps
3. Re-check:     npm run verify:razorpay:prod
`);
    process.exit(1);
  }

  console.log("\nProduction checkout can open Razorpay (capabilities OK).\n");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
