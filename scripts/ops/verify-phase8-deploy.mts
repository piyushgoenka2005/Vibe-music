#!/usr/bin/env npx tsx
/**
 * Phase 8 — production deploy sync gate.
 *
 *   npm run verify:phase8
 *   VERIFY_BASE_URL=https://vibemusic.in npm run verify:phase8
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const BASE_URL = (process.env.VERIFY_BASE_URL ?? "https://vibemusic.in").replace(/\/$/, "");
const VPS_HOST = process.env.VPS_HOST ?? "31.42.125.219";
const VPS_USER = process.env.VPS_USER ?? "root";

const localHead = spawnSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).stdout.trim();
const localShort = spawnSync("git", ["rev-parse", "--short", "HEAD"], { encoding: "utf8" }).stdout.trim();

let liveVersion = "unknown";
try {
  const response = await fetch(`${BASE_URL}/api/health`, { cache: "no-store" });
  const body = (await response.json()) as { version?: string };
  liveVersion = body.version?.trim() || "unknown";
} catch (error) {
  liveVersion = `error: ${error instanceof Error ? error.message : String(error)}`;
}

const synced =
  liveVersion !== "unknown" &&
  liveVersion !== "local" &&
  (liveVersion === localHead || liveVersion.startsWith(localShort) || localHead.startsWith(liveVersion));

const keyPath = path.join(os.homedir(), ".ssh", "vibe_vps_deploy");
let sshOk = false;
let sshDetail = "no local deploy key";
if (fs.existsSync(keyPath)) {
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
      "echo SSH_OK",
    ],
    { encoding: "utf8" },
  );
  sshOk = ssh.status === 0 && (ssh.stdout ?? "").includes("SSH_OK");
  sshDetail = sshOk ? "connected" : (ssh.stderr ?? ssh.stdout ?? "failed").trim().split("\n")[0];
}

console.log(`
Phase 8 — deploy sync
─────────────────────
Local main:     ${localShort} (${localHead})
Live /health:   ${liveVersion}
Deploy synced:  ${synced ? "YES" : "NO"}
SSH (${VPS_USER}@${VPS_HOST}): ${sshOk ? "OK" : "FAIL"} — ${sshDetail}
`);

if (!synced) {
  console.log(`VPS console one-liner (paste as root):
  curl -fsSL https://raw.githubusercontent.com/piyushgoenka2005/Vibe-music/main/deploy/vps-console-go-live.sh | bash

GitHub: set VPS_SSH_KEY secret → Actions → Deploy production → Run workflow
`);
}

process.exit(synced ? 0 : 1);
