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
  ...loadEnvFile(".env.production"),
  ...loadEnvFile(".env.production.local"),
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
  "NEXT_PUBLIC_GA_MEASUREMENT_ID",
  "GA_MEASUREMENT_API_SECRET",
  "NEXT_PUBLIC_STORE_PHONE",
  "NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION",
  "UPSTASH_REDIS_REST_URL",
  "UPSTASH_REDIS_REST_TOKEN",
  "CDN_STORAGE_ROOT",
  "CDN_PUBLIC_BASE_URL",
  "SMTP_ADMIN_TO",
  "GOOGLE_PLACES_API_KEY",
];

/** Aliases accepted by src/lib/server/googlePlaces.ts (any one is enough). */
const placesAliases = [
  "GOOGLE_MAPS_API_KEY",
  "NEXT_PUBLIC_GOOGLE_MAPS_API_KEY",
  "NEXT_PUBLIC_GOOGLE_PLACES_API_KEY",
];

const PLACEHOLDER_PLACES_KEY =
  /^(your-|xxx+|changeme|placeholder|todo|replace|example|dummy|test[_-]?key)/i;

function isUsablePlacesKey(raw) {
  const value = typeof raw === "string" ? raw.trim() : "";
  if (!value) return false;
  if (PLACEHOLDER_PLACES_KEY.test(value)) return false;
  if (value.length < 20) return false;
  return true;
}

function inspectPlacesEnv() {
  const keys = ["GOOGLE_PLACES_API_KEY", ...placesAliases];
  for (const key of keys) {
    if (isUsablePlacesKey(env[key])) {
      return { status: "configured", source: key };
    }
  }
  for (const key of keys) {
    const value = env[key]?.trim?.() ?? "";
    if (!value) continue;
    if (PLACEHOLDER_PLACES_KEY.test(value)) {
      return { status: "invalid", reason: "placeholder", source: key };
    }
    if (value.length < 20) {
      return { status: "invalid", reason: "too_short", source: key };
    }
  }
  return { status: "missing" };
}

const optional = [
  "NEXT_PUBLIC_GTM_ID",
  "INVOICE_PDF_ENABLED",
  "NEXT_PUBLIC_INVOICE_PDF_ENABLED",
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
const placesInspection = inspectPlacesEnv();
if (placesInspection.status === "missing") {
  console.log(
    "  (optional) Set GOOGLE_PLACES_API_KEY or an alias for checkout address autocomplete."
  );
} else if (placesInspection.status === "invalid") {
  console.log(
    `  (invalid) ${placesInspection.source} looks unusable (${placesInspection.reason}); autocomplete will stay off.`
  );
} else {
  console.log(
    `  (ok) Google Places key present via ${placesInspection.source}`
  );
}
console.log("\nOptional:");
for (const key of optional) {
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
