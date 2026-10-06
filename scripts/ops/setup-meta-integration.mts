#!/usr/bin/env npx tsx
/**
 * Configure Meta Pixel + CAPI + domain verification in .env.local (and optionally VPS).
 *
 * Usage:
 *   npx tsx scripts/ops/setup-meta-integration.mts
 *   npx tsx scripts/ops/setup-meta-integration.mts --capi=EAA... --domain=abc123...
 *   npx tsx scripts/ops/setup-meta-integration.mts --sync-vps
 */
import fs from "node:fs";
import path from "node:path";
import readline from "node:readline/promises";
import { fileURLToPath } from "node:url";
import { stdin as input, stdout as output } from "node:process";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const ENV_LOCAL = path.join(ROOT, ".env.local");
const DEFAULT_PIXEL_ID = "2368094903963199";
const GRAPH_API_VERSION = "v21.0";

type MetaCreds = {
  pixelId: string;
  capiToken?: string;
  domainToken?: string;
  testEventCode?: string;
};

function parseArgs(argv: string[]) {
  const out: Record<string, string | boolean> = { syncVps: false, fromOpsSecrets: false };
  for (const arg of argv) {
    if (arg === "--sync-vps") out.syncVps = true;
    if (arg === "--from-ops-secrets") out.fromOpsSecrets = true;
    else if (arg.startsWith("--pixel=")) out.pixel = arg.slice("--pixel=".length);
    else if (arg.startsWith("--capi=")) out.capi = arg.slice("--capi=".length);
    else if (arg.startsWith("--domain=")) out.domain = arg.slice("--domain=".length);
    else if (arg.startsWith("--test=")) out.test = arg.slice("--test=".length);
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

function upsertEnvFile(filePath: string, updates: Record<string, string | undefined>) {
  const raw = fs.existsSync(filePath) ? fs.readFileSync(filePath, "utf8") : "";
  const lines = raw.length > 0 ? raw.split(/\r?\n/) : [];
  const metaKeys = new Set([
    "NEXT_PUBLIC_META_PIXEL_ID",
    "META_CAPI_ACCESS_TOKEN",
    "NEXT_PUBLIC_META_DOMAIN_VERIFICATION",
    "META_TEST_EVENT_CODE",
  ]);

  const next = lines.filter((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) return true;
    const idx = trimmed.indexOf("=");
    if (idx <= 0) return true;
    const key = trimmed.slice(0, idx).trim();
    return !metaKeys.has(key);
  });

  while (next.length > 0 && next[next.length - 1] === "") next.pop();

  next.push("", "# Meta Pixel + CAPI");
  for (const [key, value] of Object.entries(updates)) {
    if (value) next.push(`${key}=${value}`);
  }
  next.push("");

  fs.writeFileSync(filePath, next.join("\n"), "utf8");
}

async function promptHidden(rl: readline.Interface, label: string): Promise<string> {
  const value = (await rl.question(`${label}: `)).trim();
  return value;
}

async function validateCapiToken(pixelId: string, token: string): Promise<{ ok: boolean; detail: string }> {
  const url = `https://graph.facebook.com/${GRAPH_API_VERSION}/${pixelId}/events?access_token=${encodeURIComponent(token)}`;
  const body = {
    data: [
      {
        event_name: "PageView",
        event_time: Math.floor(Date.now() / 1000),
        event_id: `setup-verify-${Date.now()}`,
        action_source: "website",
        event_source_url: "https://vibemusic.in/",
        user_data: {},
      },
    ],
    test_event_code: process.env.META_TEST_EVENT_CODE?.trim() || undefined,
  };

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const payload = (await response.json()) as { events_received?: number; error?: { message?: string } };
    if (response.ok && (payload.events_received ?? 0) >= 1) {
      return { ok: true, detail: "CAPI token accepted by Graph API" };
    }
    return {
      ok: false,
      detail: payload.error?.message ?? `HTTP ${response.status}`,
    };
  } catch (error) {
    return { ok: false, detail: error instanceof Error ? error.message : String(error) };
  }
}

function loadOpsSecrets(): Map<string, string> {
  const opsPath = path.join(ROOT, "deploy", "ops-secrets.env");
  if (!fs.existsSync(opsPath)) return new Map();
  return parseEnvFile(fs.readFileSync(opsPath, "utf8"));
}

async function collectCreds(args: ReturnType<typeof parseArgs>): Promise<MetaCreds> {
  const rl = readline.createInterface({ input, output });
  try {
    const opsSecrets = args.fromOpsSecrets ? loadOpsSecrets() : new Map<string, string>();
    const existing = fs.existsSync(ENV_LOCAL) ? parseEnvFile(fs.readFileSync(ENV_LOCAL, "utf8")) : new Map();
    for (const [key, value] of opsSecrets) {
      if (value) existing.set(key, value);
    }

    const pixelId =
      (typeof args.pixel === "string" && args.pixel) ||
      existing.get("NEXT_PUBLIC_META_PIXEL_ID") ||
      DEFAULT_PIXEL_ID;

    let capiToken =
      (typeof args.capi === "string" && args.capi) || existing.get("META_CAPI_ACCESS_TOKEN") || "";
    let domainToken =
      (typeof args.domain === "string" && args.domain) ||
      existing.get("NEXT_PUBLIC_META_DOMAIN_VERIFICATION") ||
      "";
    const testEventCode =
      (typeof args.test === "string" && args.test) || existing.get("META_TEST_EVENT_CODE") || "";

    if (!capiToken) {
      capiToken = await promptHidden(
        rl,
        "META_CAPI_ACCESS_TOKEN (Events Manager → Pixel → Settings → Conversions API → Generate token)",
      );
    }
    if (!domainToken) {
      domainToken = await promptHidden(
        rl,
        "NEXT_PUBLIC_META_DOMAIN_VERIFICATION (Business Settings → Domains → vibemusic.in → Meta tag content=)",
      );
    }

    return { pixelId, capiToken, domainToken, testEventCode: testEventCode || undefined };
  } finally {
    rl.close();
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const creds = await collectCreds(args);

  if (!/^\d{5,20}$/.test(creds.pixelId)) {
    console.error("Invalid NEXT_PUBLIC_META_PIXEL_ID");
    process.exit(1);
  }
  if (!creds.capiToken) {
    console.error("META_CAPI_ACCESS_TOKEN is required for full e2e integration.");
    process.exit(1);
  }
  if (!creds.domainToken) {
    console.error("NEXT_PUBLIC_META_DOMAIN_VERIFICATION is required for domain verification.");
    process.exit(1);
  }

  console.log("\nValidating CAPI token…");
  const capiCheck = await validateCapiToken(creds.pixelId, creds.capiToken);
  if (!capiCheck.ok) {
    console.error(`CAPI validation failed: ${capiCheck.detail}`);
    process.exit(1);
  }
  console.log(`OK  ${capiCheck.detail}`);

  upsertEnvFile(ENV_LOCAL, {
    NEXT_PUBLIC_META_PIXEL_ID: creds.pixelId,
    META_CAPI_ACCESS_TOKEN: creds.capiToken,
    NEXT_PUBLIC_META_DOMAIN_VERIFICATION: creds.domainToken,
    META_TEST_EVENT_CODE: creds.testEventCode,
  });
  console.log(`\nWrote Meta credentials to ${path.relative(ROOT, ENV_LOCAL)}`);
  console.log("Restart dev server: npm run dev\n");

  if (args.syncVps) {
    const { spawnSync } = await import("node:child_process");
    const sync = spawnSync("npm", ["run", "ops:sync-meta-integration-vps"], {
      cwd: ROOT,
      stdio: "inherit",
      shell: true,
    });
    process.exit(sync.status ?? 1);
  }

  console.log("Next: npm run ops:sync-meta-integration-vps  (push to production + redeploy)\n");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
