#!/usr/bin/env node
/**
 * Push AUTH_GOOGLE_ID + AUTH_GOOGLE_SECRET from .env.local to the production VPS.
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
  console.error("Missing .env.local — run npm run setup:google-oauth first.");
  process.exit(1);
}

if (!fs.existsSync(key)) {
  console.error(`Deploy key not found: ${key}`);
  process.exit(1);
}

const local = parseEnv(fs.readFileSync(localEnvPath, "utf8"));
const clientId = local.get("AUTH_GOOGLE_ID") ?? local.get("GOOGLE_CLIENT_ID");
const clientSecret = local.get("AUTH_GOOGLE_SECRET") ?? local.get("GOOGLE_CLIENT_SECRET");

if (!clientId || !clientSecret) {
  console.error("AUTH_GOOGLE_ID / AUTH_GOOGLE_SECRET not found in .env.local");
  process.exit(1);
}

const remoteScriptPath = "/tmp/vibe-sync-google-oauth.mjs";
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

const credsPath = "/tmp/vibe-google-oauth-creds.json";
const creds = JSON.parse(fs.readFileSync(credsPath, "utf8"));
const clientId = creds.clientId;
const clientSecret = creds.clientSecret;
if (!clientId || !clientSecret) {
  console.error("Missing creds");
  process.exit(1);
}

upsert(".env", "AUTH_GOOGLE_ID", clientId);
upsert(".env", "AUTH_GOOGLE_SECRET", clientSecret);
upsert("deploy/ops-secrets.env", "AUTH_GOOGLE_ID", clientId);
upsert("deploy/ops-secrets.env", "AUTH_GOOGLE_SECRET", clientSecret);
// .env.local overrides .env in production — remove stale OAuth lines if present.
if (fs.existsSync(".env.local")) {
  const localPath = ".env.local";
  const filtered = fs
    .readFileSync(localPath, "utf8")
    .split(/\r?\n/)
    .filter((line) => !/^AUTH_GOOGLE_(ID|SECRET)=/.test(line.trim()))
    .join("\n");
  fs.writeFileSync(localPath, filtered.endsWith("\n") ? filtered : `${filtered}\n`);
}
fs.unlinkSync(credsPath);
console.log("Google OAuth credentials updated (.env, ops-secrets; stale .env.local lines removed)");
`;

const scriptPayload = Buffer.from(remoteScript).toString("base64");
const credsPayload = Buffer.from(JSON.stringify({ clientId, clientSecret })).toString("base64");
const credsPath = "/tmp/vibe-google-oauth-creds.json";
const sshCmd = [
  `echo ${credsPayload} | base64 -d > ${credsPath}`,
  `echo ${scriptPayload} | base64 -d > ${remoteScriptPath}`,
  `cd ~/Vibe-music && node ${remoteScriptPath}`,
  `rm -f ${remoteScriptPath}`,
  "npm run verify:google-oauth:prod",
  "pm2 restart vibe vibe-worker --update-env",
  "pm2 save",
].join(" && ");

const ssh = spawnSync(
  "ssh",
  ["-i", key, "-o", "IdentitiesOnly=yes", `${user}@${host}`, sshCmd],
  { encoding: "utf8" },
);

process.stdout.write(ssh.stdout ?? "");
process.stderr.write(ssh.stderr ?? "");
process.exit(ssh.status ?? 1);
