#!/usr/bin/env npx tsx
/**
 * Phase 9 — L-30 compliance live gate (GSTIN + legal entity in homepage HTML).
 *
 *   npm run verify:phase9
 *   REQUIRE_COMPLIANCE=true npm run verify:phase9
 */
import { spawnSync } from "node:child_process";

const BASE_URL = (process.env.VERIFY_BASE_URL ?? "https://vibemusic.in").replace(/\/$/, "");
const STRICT = process.env.REQUIRE_COMPLIANCE === "true";

async function probeHomepage(): Promise<{ gstin: string | null; legalOk: boolean; status: number }> {
  const response = await fetch(`${BASE_URL}/`, { cache: "no-store" });
  const html = await response.text();
  const gstinMatch = html.match(/GSTIN:\s*([0-9A-Z]{15})/i);
  const legalOk = /Sikkim Commerce House|Vibe Music/i.test(html);
  return {
    gstin: gstinMatch?.[1] ?? null,
    legalOk,
    status: response.status,
  };
}

console.log(`
Phase 9 — L-30 compliance live
──────────────────────────────
Target: ${BASE_URL}/
`);

let homepageOk = false;
let gstin: string | null = null;
let legalOk = false;

try {
  const probe = await probeHomepage();
  homepageOk = probe.status === 200;
  gstin = probe.gstin;
  legalOk = probe.legalOk;
} catch (error) {
  console.error(`FAIL — could not fetch homepage: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
}

console.log(`Homepage HTTP:  ${homepageOk ? "200" : "not OK"}`);
console.log(`Legal entity:   ${legalOk ? "visible" : "missing"}`);
console.log(`GSTIN:          ${gstin ?? "not in HTML"}`);

const passed = homepageOk && Boolean(gstin) && legalOk;

if (passed) {
  console.log("\nPASS — L-30 compliance live.");
  process.exit(0);
}

console.log("\nFAIL — L-30 compliance not live.");
console.log(`
Operator fix (VPS):
  cd ~/Vibe-music && bash deploy/production.sh compliance

Or non-interactive:
  NEXT_PUBLIC_GSTIN=19XXXXXXXXXXXXX NEXT_PUBLIC_LEGAL_ENTITY_NAME="Entity Name" bash deploy/production.sh compliance

Admin fallback (no rebuild): Admin → Settings → GST number + store name
`);

if (STRICT) {
  const signoff = spawnSync("npx", ["tsx", "scripts/ops/prod-signoff.mts"], {
    stdio: "inherit",
    shell: process.platform === "win32",
    env: { ...process.env, VERIFY_BASE_URL: BASE_URL, REQUIRE_COMPLIANCE: "true" },
  });
  process.exit(signoff.status ?? 1);
}

process.exit(1);
