#!/usr/bin/env npx tsx
/**
 * Configure Razorpay live keys in .env.local for production sync.
 *
 * Usage:
 *   npx tsx scripts/ops/setup-razorpay-integration.mts
 *   npx tsx scripts/ops/setup-razorpay-integration.mts --key-id=rzp_live_... --secret=... --webhook=...
 *   npx tsx scripts/ops/setup-razorpay-integration.mts --sync-vps
 */
import fs from "node:fs";
import path from "node:path";
import readline from "node:readline/promises";
import { fileURLToPath } from "node:url";
import { stdin as input, stdout as output } from "node:process";
import { spawnSync } from "node:child_process";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const ENV_LOCAL = path.join(ROOT, ".env.local");

const RAZORPAY_KEYS = [
  "RAZORPAY_KEY_ID",
  "RAZORPAY_KEY_SECRET",
  "NEXT_PUBLIC_RAZORPAY_KEY_ID",
  "RAZORPAY_WEBHOOK_SECRET",
] as const;

type RazorpayCreds = {
  keyId: string;
  keySecret: string;
  webhookSecret: string;
};

function parseArgs(argv: string[]) {
  const out: Record<string, string | boolean> = { syncVps: false };
  for (const arg of argv) {
    if (arg === "--sync-vps") out.syncVps = true;
    else if (arg.startsWith("--key-id=")) out.keyId = arg.slice("--key-id=".length);
    else if (arg.startsWith("--secret=")) out.secret = arg.slice("--secret=".length);
    else if (arg.startsWith("--webhook=")) out.webhook = arg.slice("--webhook=".length);
  }
  return out;
}

function parseEnvFile(text: string): Map<string, string> {
  const out = new Map<string, string>();
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx <= 0) continue;
    out.set(trimmed.slice(0, idx).trim(), trimmed.slice(idx + 1).trim());
  }
  return out;
}

function upsertEnvFile(filePath: string, updates: Record<string, string>) {
  const raw = fs.existsSync(filePath) ? fs.readFileSync(filePath, "utf8") : "";
  const lines = raw.length > 0 ? raw.split(/\r?\n/) : [];
  const razorpayKeySet = new Set<string>(RAZORPAY_KEYS);

  const next = lines.filter((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) return true;
    const idx = trimmed.indexOf("=");
    if (idx <= 0) return true;
    const key = trimmed.slice(0, idx).trim();
    return !razorpayKeySet.has(key);
  });

  while (next.length > 0 && next[next.length - 1] === "") next.pop();

  next.push("", "# Razorpay — live keys for vibemusic.in");
  for (const key of RAZORPAY_KEYS) {
    const value = updates[key];
    if (value) next.push(`${key}=${value}`);
  }
  next.push("");

  fs.writeFileSync(filePath, next.join("\n"), "utf8");
}

function validateCreds(creds: RazorpayCreds): string | null {
  if (!creds.keyId.startsWith("rzp_live_")) {
    return "RAZORPAY_KEY_ID must be a live key (rzp_live_…). Test keys are rejected on vibemusic.in.";
  }
  if (!creds.keySecret || creds.keySecret.length < 16) {
    return "RAZORPAY_KEY_SECRET looks too short.";
  }
  if (!creds.webhookSecret || creds.webhookSecret.length < 8) {
    return "RAZORPAY_WEBHOOK_SECRET is required for payment status webhooks.";
  }
  return null;
}

async function promptCreds(args: ReturnType<typeof parseArgs>): Promise<RazorpayCreds> {
  const existing = fs.existsSync(ENV_LOCAL) ? parseEnvFile(fs.readFileSync(ENV_LOCAL, "utf8")) : new Map();

  const rl = readline.createInterface({ input, output });
  try {
    const keyId =
      (args.keyId as string | undefined)?.trim() ||
      existing.get("RAZORPAY_KEY_ID") ||
      (await rl.question("Razorpay Key ID (rzp_live_…): ")).trim();
    const keySecret =
      (args.secret as string | undefined)?.trim() ||
      existing.get("RAZORPAY_KEY_SECRET") ||
      (await rl.question("Razorpay Key Secret: ")).trim();
    const webhookSecret =
      (args.webhook as string | undefined)?.trim() ||
      existing.get("RAZORPAY_WEBHOOK_SECRET") ||
      (await rl.question("Webhook secret (Razorpay Dashboard → Webhooks): ")).trim();

    return { keyId, keySecret, webhookSecret };
  } finally {
    rl.close();
  }
}

async function verifyApi(creds: RazorpayCreds): Promise<boolean> {
  const auth = Buffer.from(`${creds.keyId}:${creds.keySecret}`).toString("base64");
  try {
    const response = await fetch("https://api.razorpay.com/v1/orders?count=1", {
      headers: { Authorization: `Basic ${auth}` },
    });
    if (!response.ok) {
      console.error(`Razorpay API probe failed: HTTP ${response.status}`);
      return false;
    }
    console.log("Razorpay API credentials accepted.");
    return true;
  } catch (error) {
    console.error("Razorpay API probe error:", error instanceof Error ? error.message : error);
    return false;
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const creds = await promptCreds(args);
  const validationError = validateCreds(creds);
  if (validationError) {
    console.error(validationError);
    process.exit(1);
  }

  const ok = await verifyApi(creds);
  if (!ok) process.exit(1);

  upsertEnvFile(ENV_LOCAL, {
    RAZORPAY_KEY_ID: creds.keyId,
    RAZORPAY_KEY_SECRET: creds.keySecret,
    NEXT_PUBLIC_RAZORPAY_KEY_ID: creds.keyId,
    RAZORPAY_WEBHOOK_SECRET: creds.webhookSecret,
  });

  console.log(`\nUpdated ${ENV_LOCAL}`);
  console.log("Webhook URL (Razorpay Dashboard): https://vibemusic.in/api/payment/webhook/razorpay");
  console.log("Events: payment.captured, payment.failed, order.paid, refund.processed");
  console.log("\nVerify locally:  npm run verify:razorpay-ops");
  console.log("Sync to VPS:     npm run ops:sync-razorpay-vps");

  if (args.syncVps) {
    const sync = spawnSync("npm", ["run", "ops:sync-razorpay-vps"], {
      cwd: ROOT,
      stdio: "inherit",
      shell: true,
    });
    process.exit(sync.status ?? 1);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
