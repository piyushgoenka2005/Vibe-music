#!/usr/bin/env node
/**
 * Push Razorpay live keys from .env.local to the production VPS.
 * Does not print secrets. Requires ~/.ssh/vibe_vps_deploy.
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const localEnvPath = path.join(root, ".env.local");
const host = process.env.VPS_HOST ?? "109.122.56.126";
const user = process.env.VPS_USER ?? "root";
const key = path.join(os.homedir(), ".ssh", "vibe_vps_deploy");

const RAZORPAY_KEYS = [
  "RAZORPAY_KEY_ID",
  "RAZORPAY_KEY_SECRET",
  "NEXT_PUBLIC_RAZORPAY_KEY_ID",
  "RAZORPAY_WEBHOOK_SECRET",
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

function mask(value) {
  if (!value) return "(missing)";
  if (value.length <= 8) return "****";
  return `${value.slice(0, 8)}…${value.slice(-4)}`;
}

if (!fs.existsSync(localEnvPath)) {
  console.error("Missing .env.local — run: npm run setup:razorpay-integration");
  process.exit(1);
}

if (!fs.existsSync(key)) {
  console.error(`Deploy key not found: ${key}`);
  process.exit(1);
}

const local = parseEnv(fs.readFileSync(localEnvPath, "utf8"));
const keyId = local.get("RAZORPAY_KEY_ID");
const keySecret = local.get("RAZORPAY_KEY_SECRET");
const publicKeyId = local.get("NEXT_PUBLIC_RAZORPAY_KEY_ID") ?? keyId;
const webhookSecret = local.get("RAZORPAY_WEBHOOK_SECRET");

if (!keyId || !keySecret) {
  console.error("RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET missing in .env.local");
  process.exit(1);
}

if (!keyId.startsWith("rzp_live_")) {
  console.error("Production requires live Razorpay keys (rzp_live_…). Run: npm run setup:razorpay-integration");
  process.exit(1);
}

if (publicKeyId !== keyId) {
  console.error("NEXT_PUBLIC_RAZORPAY_KEY_ID must match RAZORPAY_KEY_ID");
  process.exit(1);
}

if (!webhookSecret) {
  console.error("RAZORPAY_WEBHOOK_SECRET missing — add it in Razorpay Dashboard → Webhooks");
  process.exit(1);
}

const creds = {
  RAZORPAY_KEY_ID: keyId,
  RAZORPAY_KEY_SECRET: keySecret,
  NEXT_PUBLIC_RAZORPAY_KEY_ID: publicKeyId,
  RAZORPAY_WEBHOOK_SECRET: webhookSecret,
};

const remoteScriptPath = "/tmp/vibe-sync-razorpay.mjs";
const credsPath = "/tmp/vibe-razorpay-creds.json";
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

// .env.local overrides .env in production — remove stale Razorpay lines.
if (fs.existsSync(".env.local")) {
  const localPath = ".env.local";
  const filtered = fs
    .readFileSync(localPath, "utf8")
    .split(/\\r?\\n/)
    .filter((line) => !/^RAZORPAY_|^NEXT_PUBLIC_RAZORPAY_KEY_ID=/.test(line.trim()))
    .join("\\n");
  fs.writeFileSync(localPath, filtered.endsWith("\\n") ? filtered : \`\${filtered}\\n\`);
}

// Demo payments must never run on production.
if (fs.existsSync(".env.local")) {
  const localPath = ".env.local";
  const filtered = fs
    .readFileSync(localPath, "utf8")
    .split(/\\r?\\n/)
    .filter((line) => !/^ALLOW_DEMO_PAYMENTS=/.test(line.trim()))
    .join("\\n");
  fs.writeFileSync(localPath, filtered.endsWith("\\n") ? filtered : \`\${filtered}\\n\`);
}

const envPath = ".env";
if (fs.existsSync(envPath)) {
  let env = fs.readFileSync(envPath, "utf8");
  if (/^ALLOW_DEMO_PAYMENTS=true/m.test(env)) {
    env = env.replace(/^ALLOW_DEMO_PAYMENTS=.*$/m, "ALLOW_DEMO_PAYMENTS=false");
    fs.writeFileSync(envPath, env);
  }
}

fs.unlinkSync("${credsPath}");
console.log("Razorpay credentials updated (.env, ops-secrets; stale .env.local lines removed)");
`;

const scriptPayload = Buffer.from(remoteScript).toString("base64");
const credsPayload = Buffer.from(JSON.stringify(creds)).toString("base64");

const sshCmd = [
  `echo ${credsPayload} | base64 -d > ${credsPath}`,
  `echo ${scriptPayload} | base64 -d > ${remoteScriptPath}`,
  `cd ~/Vibe-music && node ${remoteScriptPath}`,
  `rm -f ${remoteScriptPath}`,
  "node scripts/ops/normalize-production-env.mjs",
  "NODE_ENV=production npm run verify:razorpay-ops",
  "git pull --ff-only origin main",
  "bash deploy/update.sh",
].join(" && ");

console.log("Syncing Razorpay live keys to production:");
for (const keyName of RAZORPAY_KEYS) {
  console.log(`  ${keyName}=${mask(creds[keyName])}`);
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
