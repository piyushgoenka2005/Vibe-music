/**
 * Ensure local CDN storage exists and .env.local points at dev-friendly paths.
 * Safe to run on every `npm run dev` — no secrets printed.
 */
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const localCdnRoot = path.join(root, ".data", "cdn");
const localCdnUrl = "http://localhost:3000/cdn-local";
const productionCdnRoot = "/var/www/cdn";
const productionCdnUrl = "https://cdn.vibemusic.in";

function upsertEnv(file, key, value) {
  const full = path.join(root, file);
  if (!fs.existsSync(full)) return false;
  let text = fs.readFileSync(full, "utf8");
  const line = `${key}=${value}`;
  if (new RegExp(`^${key}=`, "m").test(text)) {
    const current = text.match(new RegExp(`^${key}=(.*)$`, "m"))?.[1]?.trim();
    if (current === value) return false;
    text = text.replace(new RegExp(`^${key}=.*$`, "m"), line);
  } else {
    text = `${text.trimEnd()}\n${line}\n`;
  }
  if (!text.endsWith("\n")) text += "\n";
  fs.writeFileSync(full, text);
  return true;
}

function shouldUseLocalCdn(storageRoot) {
  if (!storageRoot) return true;
  const normalized = storageRoot.replace(/\\/g, "/");
  if (normalized === productionCdnRoot && process.platform !== "linux") return true;
  if (!fs.existsSync(storageRoot)) return true;
  return false;
}

function loadEnvValue(file, key) {
  const full = path.join(root, file);
  if (!fs.existsSync(full)) return "";
  const text = fs.readFileSync(full, "utf8");
  return text.match(new RegExp(`^${key}=(.*)$`, "m"))?.[1]?.trim() ?? "";
}

fs.mkdirSync(localCdnRoot, { recursive: true });

if (process.env.NODE_ENV === "production") {
  process.exit(0);
}

const envLocalPath = path.join(root, ".env.local");
if (!fs.existsSync(envLocalPath)) {
  process.exit(0);
}

const currentRoot = loadEnvValue(".env.local", "CDN_STORAGE_ROOT");
const currentUrl = loadEnvValue(".env.local", "CDN_PUBLIC_BASE_URL");
const targetRoot = localCdnRoot.replace(/\\/g, "/");

let changed = false;
if (shouldUseLocalCdn(currentRoot)) {
  changed = upsertEnv(".env.local", "CDN_STORAGE_ROOT", targetRoot) || changed;
}
if (!currentUrl || currentUrl === productionCdnUrl) {
  changed = upsertEnv(".env.local", "CDN_PUBLIC_BASE_URL", localCdnUrl) || changed;
}

if (changed) {
  console.warn(
    `[vibe] Local CDN configured: ${targetRoot} → ${localCdnUrl} (admin uploads + bulk import images)`,
  );
}
