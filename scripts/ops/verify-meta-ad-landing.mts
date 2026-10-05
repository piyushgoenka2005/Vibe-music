#!/usr/bin/env npx tsx
/**
 * Verify Meta ad landing: brand routes, OG metadata, redirects, and optional Meta Pixel.
 *
 * Usage:
 *   npx tsx scripts/ops/verify-meta-ad-landing.mts
 *   VERIFY_BASE_URL=https://vibemusic.in npx tsx scripts/ops/verify-meta-ad-landing.mts
 */
import { getMetaPixelId, isMetaPixelConfigured } from "../../src/lib/analytics/metaPixel";

const BASE_URL = (process.env.VERIFY_BASE_URL ?? "https://vibemusic.in").replace(/\/$/, "");
const BRAND_SLUG = process.env.VERIFY_BRAND_SLUG ?? "gibraltar";

type Check = { name: string; ok: boolean; detail: string; required: boolean };

function pass(name: string, detail: string, required = true): Check {
  return { name, ok: true, detail, required };
}

function fail(name: string, detail: string, required = true): Check {
  return { name, ok: false, detail, required };
}

function extractMeta(html: string, property: string): string | null {
  const og = html.match(
    new RegExp(`<meta[^>]+property=["']${property}["'][^>]+content=["']([^"']+)`, "i"),
  );
  if (og?.[1]) return og[1].replace(/&amp;/g, "&").replace(/&#x27;/g, "'");
  const name = html.match(
    new RegExp(`<meta[^>]+name=["']${property}["'][^>]+content=["']([^"']+)`, "i"),
  );
  return name?.[1]?.replace(/&amp;/g, "&").replace(/&#x27;/g, "'") ?? null;
}

function extractTitle(html: string): string | null {
  const match = html.match(/<title>([^<]+)<\/title>/i);
  return match?.[1]?.trim() ?? null;
}

async function fetchHtml(path: string, followRedirect = true): Promise<{
  status: number;
  html: string;
  finalUrl: string;
  location: string | null;
}> {
  const url = `${BASE_URL}${path}`;
  const response = await fetch(url, {
    redirect: followRedirect ? "follow" : "manual",
    headers: {
      "user-agent": "facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)",
      accept: "text/html",
    },
    cache: "no-store",
  });
  const html = await response.text();
  return {
    status: response.status,
    html,
    finalUrl: response.url,
    location: response.headers.get("location"),
  };
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
        false,
      ),
    );
  }

  try {
    const brandPage = await fetchHtml(`/brands/${BRAND_SLUG}`);
    if (brandPage.status !== 200) {
      checks.push(fail("GET /brands/{slug}", `HTTP ${brandPage.status}`));
    } else {
      checks.push(pass("GET /brands/{slug}", `HTTP ${brandPage.status}`));
      const title = extractTitle(brandPage.html);
      const ogTitle = extractMeta(brandPage.html, "og:title");
      const ogUrl = extractMeta(brandPage.html, "og:url");
      const ogImage = extractMeta(brandPage.html, "og:image");

      if (title?.toUpperCase().includes(BRAND_SLUG.toUpperCase())) {
        checks.push(pass("brand:title", title));
      } else {
        checks.push(fail("brand:title", title ?? "missing"));
      }

      if (ogTitle?.toUpperCase().includes(BRAND_SLUG.toUpperCase())) {
        checks.push(pass("brand:og:title", ogTitle));
      } else {
        checks.push(fail("brand:og:title", ogTitle ?? "missing"));
      }

      if (ogUrl?.includes(`/brands/${BRAND_SLUG}`)) {
        checks.push(pass("brand:og:url", ogUrl));
      } else {
        checks.push(fail("brand:og:url", ogUrl ?? "missing"));
      }

      if (ogImage) {
        checks.push(pass("brand:og:image", ogImage.slice(0, 80)));
      } else {
        checks.push(fail("brand:og:image", "missing"));
      }

      if (isMetaPixelConfigured() && brandPage.html.includes("connect.facebook.net")) {
        checks.push(pass("brand:meta-pixel-script", "fbevents.js referenced"));
      } else if (isMetaPixelConfigured()) {
        checks.push(fail("brand:meta-pixel-script", "fbevents.js not in HTML"));
      }

      const pixelId = getMetaPixelId();
      if (pixelId && brandPage.html.includes(`fbq('init', '${pixelId}')`)) {
        checks.push(pass("brand:meta-pixel-init", `fbq init with ${pixelId}`));
      } else if (isMetaPixelConfigured()) {
        checks.push(fail("brand:meta-pixel-init", "fbq init missing or wrong Pixel ID"));
      }

      const domainToken = process.env.NEXT_PUBLIC_META_DOMAIN_VERIFICATION?.trim();
      if (domainToken && brandPage.html.includes('name="facebook-domain-verification"')) {
        checks.push(pass("brand:domain-verification", "facebook-domain-verification meta tag"));
      } else if (domainToken) {
        checks.push(
          fail("brand:domain-verification", "domain verification meta tag missing", false),
        );
      }
    }

    const legacyBrand = await fetchHtml(`/brands?brand=${BRAND_SLUG}`, false);
    const brandRedirectTarget = legacyBrand.location ?? legacyBrand.finalUrl;
    if (brandRedirectTarget.includes(`/brands/${BRAND_SLUG}`)) {
      checks.push(
        pass(
          "redirect:/brands?brand=",
          `HTTP ${legacyBrand.status} → ${brandRedirectTarget}`,
        ),
      );
    } else {
      checks.push(
        fail(
          "redirect:/brands?brand=",
          `HTTP ${legacyBrand.status} location=${legacyBrand.location ?? "none"}`,
        ),
      );
    }

    const legacySearch = await fetchHtml(`/search/results?brand=${BRAND_SLUG}`, false);
    const searchRedirectTarget = legacySearch.location ?? legacySearch.finalUrl;
    if (searchRedirectTarget.includes(`/brands/${BRAND_SLUG}`)) {
      checks.push(pass("redirect:/search/results?brand=", searchRedirectTarget));
    } else {
      checks.push(
        fail(
          "redirect:/search/results?brand=",
          `HTTP ${legacySearch.status} location=${legacySearch.location ?? "none"}`,
        ),
      );
    }

    const deals = await fetchHtml("/deals");
    if (deals.status === 200 && extractMeta(deals.html, "og:url")?.includes("/deals")) {
      checks.push(pass("deals:og:url", extractMeta(deals.html, "og:url")!));
    } else {
      checks.push(fail("deals:og:url", `HTTP ${deals.status}`));
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    checks.push(fail("fetch", message));
  }

  console.log(`\nMeta ad landing verification — ${BASE_URL}\n`);
  for (const check of checks) {
    const mark = check.ok ? "OK  " : check.required ? "FAIL" : "WARN";
    console.log(`${mark}  ${check.name.padEnd(34)} ${check.detail}`);
  }

  const requiredFailed = checks.filter((check) => !check.ok && check.required);
  const optionalFailed = checks.filter((check) => !check.ok && !check.required);

  if (requiredFailed.length > 0) {
    console.error(`\n${requiredFailed.length} required check(s) failed.\n`);
    process.exit(1);
  }

  if (optionalFailed.length > 0) {
    console.warn(
      `\n${optionalFailed.length} optional check(s) failed (set NEXT_PUBLIC_META_PIXEL_ID on VPS).\n`,
    );
  } else {
    console.log("\nAll required checks passed.\n");
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
