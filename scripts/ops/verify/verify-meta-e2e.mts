#!/usr/bin/env npx tsx
/**
 * End-to-end Meta integration check: env, CAPI token, domain tag, relay API, live HTML.
 *
 * Usage:
 *   npx tsx --env-file=.env.local scripts/ops/verify/verify-meta-e2e.mts
 *   VERIFY_BASE_URL=https://vibemusic.in npx tsx --env-file=.env.local scripts/ops/verify/verify-meta-e2e.mts
 */
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  getMetaDomainVerification,
  getMetaPixelId,
  isMetaPixelConfigured,
} from "../../../src/lib/analytics/metaPixel";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const BASE_URL = (process.env.VERIFY_BASE_URL ?? "http://localhost:3000").replace(/\/$/, "");

type Check = { name: string; ok: boolean; detail: string };

function pass(name: string, detail: string): Check {
  return { name, ok: true, detail };
}

function fail(name: string, detail: string): Check {
  return { name, ok: false, detail };
}

async function validateCapiToken(pixelId: string, token: string): Promise<Check> {
  const url = `https://graph.facebook.com/v21.0/${pixelId}/events?access_token=${encodeURIComponent(token)}`;
  const body = {
    data: [
      {
        event_name: "PageView",
        event_time: Math.floor(Date.now() / 1000),
        event_id: `e2e-verify-${Date.now()}`,
        action_source: "website",
        event_source_url: "https://vibemusic.in/",
        user_data: {},
      },
    ],
  };

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const payload = (await response.json()) as { events_received?: number; error?: { message?: string } };
    if (response.ok && (payload.events_received ?? 0) >= 1) {
      return pass("capi:graph-api", "Test PageView accepted by Meta Graph API");
    }
    return fail("capi:graph-api", payload.error?.message ?? `HTTP ${response.status}`);
  } catch (error) {
    return fail("capi:graph-api", error instanceof Error ? error.message : String(error));
  }
}

async function checkRelayApi(): Promise<Check> {
  try {
    const response = await fetch(`${BASE_URL}/api/analytics/meta`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Origin: BASE_URL,
      },
      body: JSON.stringify({
        eventName: "PageView",
        eventId: `relay-e2e-${Date.now()}`,
        eventSourceUrl: `${BASE_URL}/`,
      }),
    });
    if (response.status === 200) {
      return pass("api:relay", "POST /api/analytics/meta → 200");
    }
    return fail("api:relay", `HTTP ${response.status}`);
  } catch (error) {
    return fail("api:relay", error instanceof Error ? error.message : String(error));
  }
}

async function checkLiveHtml(): Promise<Check[]> {
  const checks: Check[] = [];
  const pixelId = getMetaPixelId();

  try {
    const response = await fetch(`${BASE_URL}/`, { cache: "no-store" });
    const html = await response.text();
    const headHtml = html.includes("</head>") ? html.slice(0, html.indexOf("</head>")) : html;

    checks.push(
      response.ok
        ? pass("live:GET /", `HTTP ${response.status}`)
        : fail("live:GET /", `HTTP ${response.status}`),
    );

    if (pixelId && headHtml.includes(`fbq('init', '${pixelId}')`)) {
      checks.push(pass("live:pixel-head", `Pixel ${pixelId} in <head>`));
    } else {
      checks.push(fail("live:pixel-head", "fbq init missing from <head>"));
    }

    const domainToken = getMetaDomainVerification();
    if (domainToken) {
      checks.push(
        html.includes('name="facebook-domain-verification"') &&
          html.includes(domainToken)
          ? pass("live:domain-tag", "facebook-domain-verification meta in HTML")
          : fail("live:domain-tag", "domain verification meta missing or wrong token"),
      );
    } else {
      checks.push(fail("live:domain-tag", "META_DOMAIN_VERIFICATION not set"));
    }
  } catch (error) {
    checks.push(fail("live:fetch", error instanceof Error ? error.message : String(error)));
  }

  return checks;
}

function runUnitTests(): Check {
  const vitestBin = path.join(ROOT, "node_modules", "vitest", "vitest.mjs");
  const result = spawnSync(
    process.execPath,
    [
      vitestBin,
      "run",
      "src/lib/analytics/metaPixel.test.ts",
      "src/lib/analytics/metaCapi.test.ts",
      "src/app/api/analytics/meta/route.test.ts",
      "src/lib/security/mutation-origin.test.ts",
    ],
    { cwd: ROOT, encoding: "utf8" },
  );
  if (result.status === 0) return pass("unit-tests", "Meta + relay unit tests passed");
  const tail = (result.stdout ?? result.stderr ?? "").split("\n").slice(-6).join("\n");
  return fail("unit-tests", tail || `exit ${result.status}`);
}

async function main() {
  const checks: Check[] = [runUnitTests()];

  if (!isMetaPixelConfigured()) {
    checks.push(fail("env:pixel", "NEXT_PUBLIC_META_PIXEL_ID missing"));
  } else {
    checks.push(pass("env:pixel", `NEXT_PUBLIC_META_PIXEL_ID=${getMetaPixelId()}`));
  }

  const capiToken = process.env.META_CAPI_ACCESS_TOKEN?.trim();
  if (!capiToken) {
    checks.push(fail("env:capi", "META_CAPI_ACCESS_TOKEN missing"));
  } else {
    checks.push(pass("env:capi", "META_CAPI_ACCESS_TOKEN set"));
    checks.push(await validateCapiToken(getMetaPixelId()!, capiToken));
  }

  if (!getMetaDomainVerification()) {
    checks.push(fail("env:domain", "META_DOMAIN_VERIFICATION missing"));
  } else {
    checks.push(pass("env:domain", "META_DOMAIN_VERIFICATION set"));
  }

  checks.push(await checkRelayApi());
  checks.push(...(await checkLiveHtml()));

  console.log(`\nMeta e2e verification — ${BASE_URL}\n`);
  for (const check of checks) {
    console.log(`${check.ok ? "OK  " : "FAIL"}  ${check.name.padEnd(22)} ${check.detail}`);
  }

  const failed = checks.filter((check) => !check.ok);
  if (failed.length > 0) {
    console.error(`\n${failed.length} check(s) failed.`);
    console.error("Fix: npm run setup:meta-integration  →  npm run ops:sync-meta-integration-vps\n");
    process.exit(1);
  }

  console.log("\nAll Meta e2e checks passed.\n");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
