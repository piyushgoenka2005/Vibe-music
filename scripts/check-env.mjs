/**
 * Report missing/optional env configuration without printing secret values.
 * Usage: npm run check:env
 */
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

function loadEnvFile(file) {
  const full = path.join(root, file);
  if (!fs.existsSync(full)) return {};
  const out = {};
  for (const line of fs.readFileSync(full, "utf8").split(/\r?\n/)) {
    if (!line || line.trimStart().startsWith("#")) continue;
    const idx = line.indexOf("=");
    if (idx <= 0) continue;
    const key = line.slice(0, idx).trim();
    const value = line.slice(idx + 1).trim();
    out[key] = value;
  }
  return out;
}

const env = {
  ...loadEnvFile(".env"),
  ...loadEnvFile(".env.local"),
};

function status(key) {
  if (key === "SMTP_PASS") {
    const smtpPass = env.SMTP_PASS?.trim();
    const resend = env.RESEND_API_KEY?.trim();
    if (smtpPass) return "SET";
    if (resend) return "SET via RESEND_API_KEY";
    return "MISSING";
  }
  if (key === "SMTP_HOST" || key === "SMTP_USER") {
    const value = env[key]?.trim();
    if (value) return "SET";
    if (env.RESEND_API_KEY?.trim()) return "SET via RESEND_API_KEY";
    return "MISSING";
  }
  const value = env[key]?.trim();
  if (!value) return "MISSING";
  if (/localhost|127\.0\.0\.1/i.test(value) && key !== "DATABASE_URL") {
    return "SET (localhost — ok for local, not for production)";
  }
  return "SET";
}

const requiredProd = [
  "NEXT_PUBLIC_SITE_URL",
  "AUTH_SECRET",
  "DATABASE_URL",
  "NEXT_PUBLIC_RAZORPAY_KEY_ID",
  "RAZORPAY_KEY_ID",
  "RAZORPAY_KEY_SECRET",
  "RAZORPAY_WEBHOOK_SECRET",
  "GUEST_ORDER_ACCESS_SECRET",
  "SMTP_HOST",
  "SMTP_USER",
  "SMTP_PASS",
];

const recommended = [
  "AUTH_URL",
  "AUTH_GOOGLE_ID",
  "AUTH_GOOGLE_SECRET",
  "UPSTASH_REDIS_REST_URL",
  "UPSTASH_REDIS_REST_TOKEN",
  "CDN_STORAGE_ROOT",
  "CDN_PUBLIC_BASE_URL",
  "SMTP_ADMIN_TO",
];

console.log("\nVibe Music env check (values hidden)\n");
console.log("Production required:");
for (const key of requiredProd) {
  console.log(`  ${status(key).padEnd(44)} ${key}`);
}
console.log("\nRecommended:");
for (const key of recommended) {
  console.log(`  ${status(key).padEnd(44)} ${key}`);
}

const missingRequired = requiredProd.filter((key) => {
  if (key === "SMTP_PASS") {
    return !(env.SMTP_PASS?.trim() || env.RESEND_API_KEY?.trim());
  }
  if (key === "SMTP_HOST" || key === "SMTP_USER") {
    return !(env[key]?.trim() || env.RESEND_API_KEY?.trim());
  }
  return !env[key]?.trim();
});
const authUrl = env.AUTH_URL?.trim() ?? "";
const siteUrl = env.NEXT_PUBLIC_SITE_URL?.trim() ?? "";

console.log("");
if (missingRequired.length) {
  console.log(`Missing required for production: ${missingRequired.join(", ")}`);
}
if (/localhost|127\.0\.0\.1/i.test(authUrl)) {
  console.log(
    "AUTH_URL is localhost — omit it or set https://vibemusic.in before production deploy."
  );
}
if (/localhost|127\.0\.0\.1/i.test(siteUrl)) {
  console.log(
    "NEXT_PUBLIC_SITE_URL is localhost — set https://vibemusic.in for production."
  );
}
if (!missingRequired.length) {
  console.log("All production-required keys are present in local env files.");
  console.log(
    "Still verify production VPS values (not localhost AUTH_URL) before go-live."
  );
}
console.log("");
process.exit(missingRequired.length ? 1 : 0);
