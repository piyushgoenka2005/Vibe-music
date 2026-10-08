#!/usr/bin/env npx tsx
/**
 * Non-deploy Meta Pixel + CAPI integration check.
 * - Env vars (from --env-file or shell)
 * - Unit test suite for Meta modules
 * - Optional live HTML check against local or staging URL
 *
 * Usage:
 *   npx tsx --env-file=.env.local scripts/ops/verify/verify-meta-integration.mts
 *   VERIFY_BASE_URL=http://localhost:3000 npx tsx --env-file=.env.local scripts/ops/verify/verify-meta-integration.mts
 */
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getMetaPixelId, isMetaPixelConfigured } from "../../src/lib/analytics/metaPixel";

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");

const BASE_URL = (process.env.VERIFY_BASE_URL ?? "http://localhost:3000").replace(/\/$/, "");

type Check = { name: string; ok: boolean; detail: string; required?: boolean };

function pass(name: string, detail: string, required = true): Check {
  return { name, ok: true, detail, required };
}

function fail(name: string, detail: string, required = true): Check {
  return { name, ok: false, detail, required };
}

function skip(name: string, detail: string): Check {
  return { name, ok: true, detail: `SKIP — ${detail}`, required: false };
}

function runMetaUnitTests(): Check {
  const vitestBin = path.join(REPO_ROOT, "node_modules", "vitest", "vitest.mjs");
  const result = spawnSync(
    process.execPath,
    [
      vitestBin,
      "run",
      "src/lib/analytics/metaPixel.test.ts",
      "src/lib/analytics/metaCapiHash.test.ts",
      "src/lib/analytics/metaCapi.test.ts",
      "src/lib/analytics/metaEventId.test.ts",
      "src/app/api/analytics/meta/route.test.ts",
      "src/lib/seo/adLanding.test.ts",
      "src/lib/seo/brandMetadata.test.ts",
      "src/lib/server/orderPaymentService.test.ts",
    ],
    { stdio: "pipe", encoding: "utf-8", cwd: REPO_ROOT },
  );
  if (result.status === 0) {
    return pass("unit-tests", "Meta-related Vitest suite passed");
  }
  const tail = (result.stdout ?? result.stderr ?? "").split("\n").slice(-8).join("\n");
  return fail("unit-tests", `Vitest failed (exit ${result.status})\n${tail}`);
}

async function checkLiveHtml(): Promise<Check[]> {
  const checks: Check[] = [];
  if (!isMetaPixelConfigured()) {
    checks.push(
      skip("live:html", "set NEXT_PUBLIC_META_PIXEL_ID in .env.local and restart dev server"),
    );
    return checks;
  }

  try {
    const response = await fetch(`${BASE_URL}/`, { cache: "no-store" });
    const html = await response.text();
    const pixelId = getMetaPixelId();

    if (response.status === 200) {
      checks.push(pass("live:GET /", `HTTP ${response.status} (${BASE_URL})`));
    } else {
      checks.push(fail("live:GET /", `HTTP ${response.status}`));
    }

    if (html.includes("fbevents.js") && html.includes(`fbq('init', '${pixelId}')`)) {
      checks.push(pass("live:fbq-init", `Pixel ${pixelId} in HTML`));
    } else {
      checks.push(
        fail(
          "live:fbq-init",
          "fbevents.js or fbq init missing — stop and restart `npm run dev` after editing .env.local",
        ),
      );
    }

    const domainToken = process.env.NEXT_PUBLIC_META_DOMAIN_VERIFICATION?.trim();
    if (domainToken) {
      if (html.includes('name="facebook-domain-verification"')) {
        checks.push(pass("live:domain-tag", "facebook-domain-verification meta present"));
      } else {
        checks.push(fail("live:domain-tag", "domain verification meta tag missing from HTML"));
      }
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    checks.push(fail("live:fetch", message));
  }

  return checks;
}

async function main() {
  const checks: Check[] = [];

  if (isMetaPixelConfigured()) {
    checks.push(pass("env:pixel", `NEXT_PUBLIC_META_PIXEL_ID=${getMetaPixelId()}`));
  } else {
    checks.push(
      fail(
        "env:pixel",
        "NEXT_PUBLIC_META_PIXEL_ID missing — create Pixel in Meta Events Manager",
      ),
    );
  }

  if (process.env.META_CAPI_ACCESS_TOKEN?.trim()) {
    checks.push(pass("env:capi", "META_CAPI_ACCESS_TOKEN set"));
  } else {
    checks.push(fail("env:capi", "META_CAPI_ACCESS_TOKEN missing"));
  }

  if (process.env.NEXT_PUBLIC_META_DOMAIN_VERIFICATION?.trim()) {
    checks.push(pass("env:domain", "NEXT_PUBLIC_META_DOMAIN_VERIFICATION set"));
  } else {
    checks.push(fail("env:domain", "NEXT_PUBLIC_META_DOMAIN_VERIFICATION missing"));
  }

  checks.push(runMetaUnitTests());
  checks.push(...(await checkLiveHtml()));

  console.log("\nMeta integration verification (no deploy)\n");
  for (const check of checks) {
    console.log(`${check.ok ? "OK  " : "FAIL"}  ${check.name.padEnd(22)} ${check.detail}`);
  }

  const failed = checks.filter((check) => !check.ok && check.required !== false);
  const optionalFailed = checks.filter((check) => !check.ok && check.required === false);

  if (failed.length > 0) {
    console.error(`\n${failed.length} required check(s) need attention.\n`);
    console.error("Next: complete Meta Business setup → add vars to .env.local → restart npm run dev\n");
    process.exit(1);
  }

  if (optionalFailed.length > 0) {
    console.warn(`\n${optionalFailed.length} optional check(s) failed.\n`);
  } else {
    console.log("\nAll required Meta integration checks passed.\n");
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
