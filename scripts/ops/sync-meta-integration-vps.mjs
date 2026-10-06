#!/usr/bin/env node
/**
 * Push Meta Pixel + CAPI + domain verification env to production VPS and redeploy.
 * Reads from .env.local (or shell env). Never logs secret values.
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

const META_KEYS = [
  "NEXT_PUBLIC_META_PIXEL_ID",
  "META_CAPI_ACCESS_TOKEN",
  "META_DOMAIN_VERIFICATION",
  "NEXT_PUBLIC_META_DOMAIN_VERIFICATION",
  "META_TEST_EVENT_CODE",
];

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

function readMetaCreds() {
  const merged = new Map();
  if (fs.existsSync(localEnvPath)) {
    for (const [k, v] of parseEnv(fs.readFileSync(localEnvPath, "utf8"))) merged.set(k, v);
  }
  for (const keyName of META_KEYS) {
    const fromShell = process.env[keyName]?.trim();
    if (fromShell) merged.set(keyName, fromShell);
  }
  if (!merged.get("NEXT_PUBLIC_META_PIXEL_ID")) {
    merged.set("NEXT_PUBLIC_META_PIXEL_ID", DEFAULT_PIXEL_ID);
  }
  return Object.fromEntries(
    META_KEYS.filter((k) => merged.get(k)).map((k) => [k, merged.get(k)]),
  );
}

function mask(value) {
  if (!value) return "(missing)";
  if (value.length <= 8) return "****";
  return `${value.slice(0, 4)}…${value.slice(-4)}`;
}

if (!fs.existsSync(key)) {
  console.error(`Deploy key not found: ${key}`);
  process.exit(1);
}

const creds = readMetaCreds();
if (!creds.NEXT_PUBLIC_META_PIXEL_ID) {
  console.error("NEXT_PUBLIC_META_PIXEL_ID missing — run: npx tsx scripts/ops/setup-meta-integration.mts");
  process.exit(1);
}
if (!creds.META_CAPI_ACCESS_TOKEN) {
  console.error("META_CAPI_ACCESS_TOKEN missing — run: npx tsx scripts/ops/setup-meta-integration.mts");
  process.exit(1);
}
const domainToken =
  creds.META_DOMAIN_VERIFICATION || creds.NEXT_PUBLIC_META_DOMAIN_VERIFICATION;
if (!domainToken) {
  console.error(
    "META_DOMAIN_VERIFICATION missing — run: npx tsx scripts/ops/setup-meta-integration.mts",
  );
  process.exit(1);
}

const remoteScriptPath = "/tmp/vibe-sync-meta-integration.mjs";
const credsPath = "/tmp/vibe-meta-integration-creds.json";
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

const creds = JSON.parse(fs.readFileSync("${credsPath}", "utf8"));
for (const [key, value] of Object.entries(creds)) {
  if (!value) continue;
  upsert(".env", key, value);
  upsert("deploy/ops-secrets.env", key, value);
}
fs.unlinkSync("${credsPath}");
console.log("Meta integration env updated (.env + deploy/ops-secrets.env)");
`;

const scriptPayload = Buffer.from(remoteScript).toString("base64");
const credsPayload = Buffer.from(JSON.stringify(creds)).toString("base64");

const sshCmd = [
  `echo ${credsPayload} | base64 -d > ${credsPath}`,
  `echo ${scriptPayload} | base64 -d > ${remoteScriptPath}`,
  `cd ~/Vibe-music && node ${remoteScriptPath}`,
  `rm -f ${remoteScriptPath}`,
  "git pull --ff-only origin main",
  "bash deploy/update.sh",
].join(" && ");

console.log("Syncing Meta integration to production:");
for (const keyName of META_KEYS) {
  if (creds[keyName]) console.log(`  ${keyName}=${mask(creds[keyName])}`);
}
console.log(`Target: ${user}@${host}\n`);

const ssh = spawnSync(
  "ssh",
  ["-i", key, "-o", "IdentitiesOnly=yes", `${user}@${host}`, sshCmd],
  { encoding: "utf8", timeout: 900_000 },
);

process.stdout.write(ssh.stdout ?? "");
process.stderr.write(ssh.stderr ?? "");
process.exit(ssh.status ?? 1);
