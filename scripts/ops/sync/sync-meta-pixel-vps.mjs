#!/usr/bin/env node
/**
 * Push NEXT_PUBLIC_META_PIXEL_ID to the production VPS and redeploy.
 * Pixel ID is public; reads from .env.local or uses the Vibe Music default.
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

const DEFAULT_PIXEL_ID = "2368094903963199";
const root = process.cwd();
const localEnvPath = path.join(root, ".env.local");
const host = process.env.VPS_HOST ?? "109.122.56.126";
const user = process.env.VPS_USER ?? "root";
const key = path.join(os.homedir(), ".ssh", "vibe_vps_deploy");

function parseEnv(text) {
  const out = new Map();
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx <= 0) continue;
    out.set(trimmed.slice(0, idx).trim(), trimmed.slice(idx + 1).trim());
  }
  return out;
}

function readPixelId() {
  const fromEnv = process.env.NEXT_PUBLIC_META_PIXEL_ID?.trim();
  if (fromEnv && /^\d{5,20}$/.test(fromEnv)) return fromEnv;
  if (fs.existsSync(localEnvPath)) {
    const local = parseEnv(fs.readFileSync(localEnvPath, "utf8"));
    const fromLocal = local.get("NEXT_PUBLIC_META_PIXEL_ID")?.trim();
    if (fromLocal && /^\d{5,20}$/.test(fromLocal)) return fromLocal;
  }
  return DEFAULT_PIXEL_ID;
}

if (!fs.existsSync(key)) {
  console.error(`Deploy key not found: ${key}`);
  process.exit(1);
}

const pixelId = readPixelId();
const remoteScriptPath = "/tmp/vibe-sync-meta-pixel.mjs";
const remoteScript = `import fs from "node:fs";

function upsert(file, key, value) {
  let content = fs.existsSync(file) ? fs.readFileSync(file, "utf8") : "";
  const line = \`\${key}=\${value}\`;
  const pattern = new RegExp(\`^\${key}=.*$\`, "m");
  content = pattern.test(content)
    ? content.replace(pattern, line)
    : \`\${content.trimEnd()}\\n\${line}\\n\`;
  fs.writeFileSync(file, content);
}

const credsPath = "/tmp/vibe-meta-pixel-creds.json";
const creds = JSON.parse(fs.readFileSync(credsPath, "utf8"));
const pixelId = creds.pixelId;
if (!pixelId) {
  console.error("Missing pixelId");
  process.exit(1);
}

upsert(".env", "NEXT_PUBLIC_META_PIXEL_ID", pixelId);
upsert("deploy/ops-secrets.env", "NEXT_PUBLIC_META_PIXEL_ID", pixelId);
fs.unlinkSync(credsPath);
console.log("Meta Pixel ID updated (.env + deploy/ops-secrets.env)");
`;

const scriptPayload = Buffer.from(remoteScript).toString("base64");
const credsPayload = Buffer.from(JSON.stringify({ pixelId })).toString("base64");
const credsPath = "/tmp/vibe-meta-pixel-creds.json";
const sshCmd = [
  `echo ${credsPayload} | base64 -d > ${credsPath}`,
  `echo ${scriptPayload} | base64 -d > ${remoteScriptPath}`,
  `cd ~/Vibe-music && node ${remoteScriptPath}`,
  `rm -f ${remoteScriptPath}`,
  "git pull --ff-only origin main",
  "bash deploy/update.sh",
].join(" && ");

console.log(`Syncing Meta Pixel ${pixelId} to ${user}@${host}…`);

const ssh = spawnSync(
  "ssh",
  ["-i", key, "-o", "IdentitiesOnly=yes", `${user}@${host}`, sshCmd],
  { encoding: "utf8", timeout: 900_000 },
);

process.stdout.write(ssh.stdout ?? "");
process.stderr.write(ssh.stderr ?? "");
process.exit(ssh.status ?? 1);
