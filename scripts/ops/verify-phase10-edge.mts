#!/usr/bin/env npx tsx
/**
 * Phase 10 — L-22 production edge + optional L-23 UFW (CloudOnFire VPS).
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
const CDN_BASE = (process.env.CDN_PUBLIC_BASE_URL ?? "https://cdn.vibemusic.in").replace(
  /\/$/,
  "",
);

function securityHeadersOk(headers: Headers): boolean {
  const hsts = headers.get("strict-transport-security") ?? "";
  const csp = headers.get("content-security-policy") ?? "";
  const nosniff = headers.get("x-content-type-options") ?? "";
  return (
    hsts.includes("max-age=") && csp.includes("default-src") && nosniff.toLowerCase() === "nosniff"
  );
}

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
  const hasNginx = /nginx|80|443/i.test(out);
  return {
    ok: hasNginx,
    detail: hasNginx ? "UFW active with nginx HTTP/HTTPS rules" : "UFW active but no nginx rules",
  };
}

console.log(`
Phase 10 — edge security (L-22 / L-23) — CloudOnFire
────────────────────────────────────────────────────
Target: ${BASE_URL}/
`);

let l22Ok = false;
let edgeDetail = "unreachable";
try {
  const response = await fetch(`${BASE_URL}/`, { redirect: "follow", cache: "no-store" });
  const server = response.headers.get("server") ?? "unknown";
  l22Ok = response.status === 200 && securityHeadersOk(response.headers);
  edgeDetail = l22Ok
    ? `HTTP 200, server=${server}, security headers OK`
    : `HTTP ${response.status}, server=${server}, security headers incomplete`;
} catch (error) {
  edgeDetail = error instanceof Error ? error.message : String(error);
}

let cdnOk = false;
try {
  const cdnResponse = await fetch(`${CDN_BASE}/`, {
    method: "HEAD",
    redirect: "follow",
    cache: "no-store",
  });
  cdnOk = cdnResponse.status > 0 && cdnResponse.status < 500;
} catch {
  cdnOk = false;
}

const ufw = probeUfw();

console.log(`L-22 production edge: ${l22Ok ? "PASS" : "FAIL"} — ${edgeDetail}`);
console.log(`CDN static host:      ${cdnOk ? "PASS" : "WARN"} — ${CDN_BASE}`);
console.log(`L-23 origin UFW:      ${ufw.ok ? "PASS" : "WARN"} — ${ufw.detail}`);

if (!l22Ok) {
  console.log(`
L-22 operator steps:
  1. CloudOnFire DNS → A records (@, www, cdn) to VPS IP
  2. On VPS: bash deploy/update.sh
  3. npm run check:edge
  Guide: docs/ops/CLOUDONFIRE-SETUP.md
`);
}

if (!ufw.ok) {
  console.log(`
L-23 operator steps:
  sudo bash deploy/vps-firewall.sh
`);
}

const passed = l22Ok && (!STRICT || (cdnOk && ufw.ok));

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
    console.log("ℹ L-23 pending — run: sudo bash deploy/vps-firewall.sh");
  }
  process.exit(0);
}

console.log("\nFAIL — Phase 10 edge security not complete.");
process.exit(1);
