#!/usr/bin/env npx tsx
/**
 * Verify Meta Pixel + CAPI env and live HTML (fbevents.js + fbq init).
 *
 * Usage:
 *   npx tsx scripts/ops/verify/verify-meta-pixel.mts
 *   VERIFY_BASE_URL=https://vibemusic.in npx tsx --env-file=.env scripts/ops/verify/verify-meta-pixel.mts
 */
import { getMetaPixelId, isMetaPixelConfigured } from "../../../src/lib/analytics/metaPixel";

function isMetaCapiConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_META_PIXEL_ID?.trim() && process.env.META_CAPI_ACCESS_TOKEN?.trim(),
  );
}

const BASE_URL = (process.env.VERIFY_BASE_URL ?? "https://vibemusic.in").replace(/\/$/, "");

type Check = { name: string; ok: boolean; detail: string; required: boolean };

function pass(name: string, detail: string, required = true): Check {
  return { name, ok: true, detail, required };
}

function fail(name: string, detail: string, required = true): Check {
  return { name, ok: false, detail, required };
}

async function main() {
  const checks: Check[] = [];

  if (isMetaPixelConfigured()) {
    checks.push(pass("env:NEXT_PUBLIC_META_PIXEL_ID", `set (${getMetaPixelId()})`));
  } else {
    checks.push(
      fail(
        "env:NEXT_PUBLIC_META_PIXEL_ID",
        "missing — add to deploy/ops-secrets.env and redeploy",
      ),
    );
  }

  if (isMetaCapiConfigured()) {
    checks.push(pass("env:META_CAPI_ACCESS_TOKEN", "set"));
  } else if (isMetaPixelConfigured()) {
    checks.push(
      fail(
        "env:META_CAPI_ACCESS_TOKEN",
        "missing — Pixel without CAPI loses server-side Purchase dedupe",
        false,
      ),
    );
  } else {
    checks.push(
      fail("env:META_CAPI_ACCESS_TOKEN", "missing (needs Pixel ID too)", false),
    );
  }

  const domainToken = process.env.NEXT_PUBLIC_META_DOMAIN_VERIFICATION?.trim();
  if (domainToken) {
    checks.push(pass("env:NEXT_PUBLIC_META_DOMAIN_VERIFICATION", "set"));
  } else {
    checks.push(
      fail(
        "env:NEXT_PUBLIC_META_DOMAIN_VERIFICATION",
        "missing — add Meta tag token for vibemusic.in verification",
        false,
      ),
    );
  }

  try {
    const response = await fetch(`${BASE_URL}/`, {
      headers: {
        accept: "text/html",
        "user-agent": "Mozilla/5.0 (compatible; VibeMetaVerify/1.0)",
      },
      cache: "no-store",
    });
    const html = await response.text();

    if (response.status === 200) {
      checks.push(pass("GET /", `HTTP ${response.status}`));
    } else {
      checks.push(fail("GET /", `HTTP ${response.status}`));
    }

    if (html.includes("connect.facebook.net") && html.includes("fbevents.js")) {
      checks.push(pass("html:fbevents.js", "referenced in page HTML"));
    } else if (isMetaPixelConfigured()) {
      checks.push(fail("html:fbevents.js", "not found — rebuild/redeploy with Pixel ID"));
    } else {
      checks.push(
        fail("html:fbevents.js", "not found (Pixel ID not configured)", false),
      );
    }

    const pixelId = getMetaPixelId();
    const headHtml = html.includes("</head>") ? html.slice(0, html.indexOf("</head>")) : html;
    if (pixelId && html.includes(`fbq('init', '${pixelId}')`)) {
      checks.push(pass("html:fbq-init", `init with Pixel ID ${pixelId}`));
    } else if (isMetaPixelConfigured()) {
      checks.push(fail("html:fbq-init", "fbq init missing or wrong Pixel ID in HTML"));
    }

    if (pixelId && headHtml.includes(`fbq('init', '${pixelId}')`)) {
      checks.push(pass("html:fbq-in-head", "base code in <head> (Meta install guide)"));
    } else if (isMetaPixelConfigured() && pixelId && html.includes(`fbq('init', '${pixelId}')`)) {
      checks.push(
        fail(
          "html:fbq-in-head",
          "fbq init is in <body> — move Meta Pixel base code into <head>",
          false,
        ),
      );
    } else if (isMetaPixelConfigured()) {
      checks.push(fail("html:fbq-in-head", "fbq init not in <head>", false));
    }

    if (pixelId && html.includes("fbq('track', 'PageView')")) {
      checks.push(pass("html:fbq-pageview", "PageView track in HTML"));
    } else if (isMetaPixelConfigured()) {
      checks.push(fail("html:fbq-pageview", "fbq PageView missing in HTML", false));
    }

    if (domainToken && html.includes('name="facebook-domain-verification"')) {
      checks.push(pass("html:domain-verification", "meta tag present"));
    } else if (domainToken) {
      checks.push(fail("html:domain-verification", "meta tag missing from HTML", false));
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    checks.push(fail("fetch", message));
  }

  console.log(`\nMeta Pixel verification — ${BASE_URL}\n`);
  for (const check of checks) {
    const mark = check.ok ? "OK  " : check.required ? "FAIL" : "WARN";
    console.log(`${mark}  ${check.name.padEnd(40)} ${check.detail}`);
  }

  const requiredFailed = checks.filter((check) => !check.ok && check.required);
  const optionalFailed = checks.filter((check) => !check.ok && !check.required);

  if (requiredFailed.length > 0) {
    console.error(`\n${requiredFailed.length} required check(s) failed.\n`);
    process.exit(1);
  }

  if (optionalFailed.length > 0) {
    console.warn(`\n${optionalFailed.length} optional check(s) failed.\n`);
  } else {
    console.log("\nAll required checks passed.\n");
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
