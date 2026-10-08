#!/usr/bin/env node
/**
 * Push RAZORPAY_WEBHOOK_SECRET from .env.local to production VPS.
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

if (!fs.existsSync(localEnvPath)) {
  console.error("Missing .env.local");
  process.exit(1);
}

if (!fs.existsSync(key)) {
  console.error(`Deploy key not found: ${key}`);
  process.exit(1);
}

const webhookSecret = parseEnv(fs.readFileSync(localEnvPath, "utf8")).get("RAZORPAY_WEBHOOK_SECRET");
if (!webhookSecret || webhookSecret.length < 8) {
  console.error("RAZORPAY_WEBHOOK_SECRET missing in .env.local");
  process.exit(1);
}

const credsPath = "/tmp/vibe-razorpay-webhook.json";
const remoteScriptPath = "/tmp/vibe-sync-razorpay-webhook.mjs";
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
  upsert(".env", key, value);
  upsert("deploy/ops-secrets.env", key, value);
}
fs.unlinkSync("${credsPath}");
console.log("RAZORPAY_WEBHOOK_SECRET updated (.env + ops-secrets)");
`;

const credsPayload = Buffer.from(JSON.stringify({ RAZORPAY_WEBHOOK_SECRET: webhookSecret })).toString(
  "base64",
);
const scriptPayload = Buffer.from(remoteScript).toString("base64");

const sshCmd = [
  `echo ${credsPayload} | base64 -d > ${credsPath}`,
  `echo ${scriptPayload} | base64 -d > ${remoteScriptPath}`,
  `cd ~/Vibe-music && node ${remoteScriptPath}`,
  `rm -f ${remoteScriptPath}`,
].join(" && ");

console.log(`Syncing RAZORPAY_WEBHOOK_SECRET to ${user}@${host}`);

const ssh = spawnSync(
  "ssh",
  ["-i", key, "-o", "IdentitiesOnly=yes", `${user}@${host}`, sshCmd],
  { encoding: "utf8", timeout: 120_000 },
);

process.stdout.write(ssh.stdout ?? "");
process.stderr.write(ssh.stderr ?? "");
process.exit(ssh.status ?? 1);
