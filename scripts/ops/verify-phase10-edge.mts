#!/usr/bin/env npx tsx
/**
 * Phase 10 — L-22 CDN/WAF edge + optional L-23 UFW (VPS SSH probe).
 *
 *   npm run verify:phase10
 *   REQUIRE_CDN_EDGE=true npm run verify:phase10
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const BASE_URL = (process.env.VERIFY_BASE_URL ?? "https://vibemusic.in").replace(/\/$/, "");
const STRICT = process.env.REQUIRE_CDN_EDGE === "true";
const VPS_HOST = process.env.VPS_HOST ?? "31.42.125.219";
const VPS_USER = process.env.VPS_USER ?? "root";

const EDGE_MARKERS = ["cf-ray", "cf-cache-status", "x-vercel-id", "x-amz-cf-id"];

function probeUfw(): { ok: boolean; detail: string } {
  const keyPath = path.join(os.homedir(), ".ssh", "vibe_vps_deploy");
  if (!fs.existsSync(keyPath)) {
    return { ok: false, detail: "SSH skipped (no deploy key)" };
  }
  const ssh = spawnSync(
    "ssh",
    [
      "-i",
      keyPath,
      "-p",
      "22",
      "-o",
      "BatchMode=yes",
      "-o",
      "ConnectTimeout=12",
      "-o",
      "StrictHostKeyChecking=accept-new",
      `${VPS_USER}@${VPS_HOST}`,
      "ufw status 2>/dev/null || echo UFW_UNAVAILABLE",
    ],
    { encoding: "utf8" },
  );
  if (ssh.status !== 0) {
    return { ok: false, detail: "SSH unavailable — verify UFW on VPS console" };
  }
  const out = ssh.stdout ?? "";
  if (!/Status:\s*active/i.test(out)) {
    return { ok: false, detail: "UFW not active" };
  }
  const hasCfCidr = /103\.21\.|104\.16\.|172\.64\.|141\.101\./.test(out);
  return {
    ok: hasCfCidr,
    detail: hasCfCidr ? "UFW active with Cloudflare CIDR rules" : "UFW active but no Cloudflare rules",
  };
}

console.log(`
Phase 10 — edge security (L-22 / L-23)
──────────────────────────────────────
Target: ${BASE_URL}/
`);

let l22Ok = false;
let edgeDetail = "no marker";
try {
  const response = await fetch(`${BASE_URL}/`, { redirect: "follow", cache: "no-store" });
  const marker = EDGE_MARKERS.find((name) => response.headers.get(name));
  l22Ok = Boolean(marker);
  edgeDetail = marker
    ? `${marker}=${response.headers.get(marker)}`
    : `server=${response.headers.get("server") ?? "unknown"}, no cf-ray`;
} catch (error) {
  edgeDetail = error instanceof Error ? error.message : String(error);
}

const ufw = probeUfw();

console.log(`L-22 CDN/WAF:     ${l22Ok ? "PASS" : "FAIL"} — ${edgeDetail}`);
console.log(`L-23 origin UFW:  ${ufw.ok ? "PASS" : "WARN"} — ${ufw.detail}`);

if (!l22Ok) {
  console.log(`
L-22 operator steps:
  1. Cloudflare → add vibemusic.in, orange-cloud A/AAAA for @ and www
  2. SSL/TLS → Full (strict)
  3. npm run check:edge  (expect cf-ray)
  Guide: deploy/cloudflare/README.md
`);
}

if (!ufw.ok) {
  console.log(`
L-23 operator steps (after L-22):
  sudo CLOUDFLARE_ONLY=1 bash deploy/complete-audit-go-live.sh
  # or: sudo bash deploy/cloudflare-ufw.sh
`);
}

const passed = l22Ok && (!STRICT || ufw.ok);

if (passed && STRICT) {
  const signoff = spawnSync("npx", ["tsx", "scripts/ops/prod-signoff.mts"], {
    stdio: "inherit",
    shell: process.platform === "win32",
    env: { ...process.env, VERIFY_BASE_URL: BASE_URL, REQUIRE_CDN_EDGE: "true" },
  });
  process.exit(signoff.status ?? 1);
}

if (passed) {
  console.log("\nPASS — Phase 10 edge security (L-22).");
  if (!ufw.ok) {
    console.log("ℹ L-23 pending — run UFW lockdown after Cloudflare is live.");
  }
  process.exit(0);
}

console.log("\nFAIL — Phase 10 edge security not complete.");
process.exit(1);
