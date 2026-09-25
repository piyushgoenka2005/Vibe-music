#!/usr/bin/env npx tsx
/**
 * Phase 8 — compare local main vs live VPS deploy + SSH probe.
 *
 * Usage:
 *   npm run phase8:status
 *   VERIFY_BASE_URL=https://vibemusic.in npm run phase8:status
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const BASE_URL = (process.env.VERIFY_BASE_URL ?? "https://vibemusic.in").replace(/\/$/, "");
const VPS_HOST = process.env.VPS_HOST ?? "87.232.72.14";
const VPS_USER = process.env.VPS_USER ?? "root";

function run(cmd: string, args: string[]): { ok: boolean; out: string } {
  const result = spawnSync(cmd, args, { encoding: "utf8", shell: process.platform === "win32" });
  const out = `${result.stdout ?? ""}${result.stderr ?? ""}`.trim();
  return { ok: result.status === 0, out };
}

const localHead = run("git", ["rev-parse", "HEAD"]).out.trim();
const localShort = run("git", ["rev-parse", "--short", "HEAD"]).out.trim();

let liveVersion = "unknown";
try {
  const response = await fetch(`${BASE_URL}/api/health`, { cache: "no-store" });
  const body = (await response.json()) as { version?: string };
  liveVersion = body.version?.trim() || "unknown";
} catch (error) {
  liveVersion = `error: ${error instanceof Error ? error.message : String(error)}`;
}

const keyPath = path.join(os.homedir(), ".ssh", "vibe_vps_deploy");
const pubPath = `${keyPath}.pub`;
const repoPubPath = path.join(process.cwd(), "deploy", "deploy_key.pub");
const localPub = fs.existsSync(pubPath) ? fs.readFileSync(pubPath, "utf8").trim() : "";
const repoPub = fs.existsSync(repoPubPath) ? fs.readFileSync(repoPubPath, "utf8").trim() : "";
const keysMatch = Boolean(localPub && repoPub && localPub === repoPub);

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

const liveMatches =
  liveVersion !== "unknown" &&
  liveVersion !== "local" &&
  (liveVersion === localHead || liveVersion.startsWith(localShort));

console.log(`
Phase 8 deploy status
─────────────────────
Local main:     ${localShort} (${localHead})
Live /health:   ${liveVersion}
Deploy synced:  ${liveMatches ? "YES" : "NO"}
SSH (${VPS_USER}@${VPS_HOST}): ${sshOk ? "OK" : "FAIL"} — ${sshDetail}
deploy_key.pub: ${keysMatch ? "matches local key" : "MISMATCH — run setup-deploy-access.ps1 and commit deploy/deploy_key.pub"}
`);

if (!sshOk) {
  console.log(`VPS console one-liner (paste as root):
  curl -fsSL https://raw.githubusercontent.com/piyushgoenka2005/Vibe-music/main/deploy/install-deploy-key.sh | bash

GitHub secret VPS_SSH_KEY = private key at ${keyPath}
Then: Actions → Deploy production → Run workflow
`);
}

process.exit(liveMatches && sshOk ? 0 : 1);
