#!/usr/bin/env npx tsx
/**
 * Static deployment-readiness check for Meta Pixel + CAPI (no live deploy required).
 * Confirms code, routes, env templates, and npm scripts are present on main.
 *
 * Usage: npx tsx scripts/ops/verify/verify-meta-deploy-ready.mts
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");

type Check = { name: string; ok: boolean; detail: string };

function pass(name: string, detail: string): Check {
  return { name, ok: true, detail };
}

function fail(name: string, detail: string): Check {
  return { name, ok: false, detail };
}

function exists(rel: string): boolean {
  return fs.existsSync(path.join(ROOT, rel));
}

function fileIncludes(rel: string, needle: string): boolean {
  return fs.readFileSync(path.join(ROOT, rel), "utf8").includes(needle);
}

function main() {
  const checks: Check[] = [];

  const requiredFiles = [
    "src/lib/analytics/metaPixel.ts",
    "src/lib/analytics/metaEvents.ts",
    "src/lib/analytics/metaEventId.ts",
    "src/lib/analytics/metaCapi.ts",
    "src/lib/analytics/metaCapiHash.ts",
    "src/lib/analytics/metaCapiRelay.ts",
    "src/app/api/analytics/meta/route.ts",
    "src/components/analytics/MetaPixelScripts.tsx",
    "src/components/analytics/MetaRouteTracker.tsx",
    "src/app/brands/[slug]/page.tsx",
    "scripts/ops/verify/verify-meta-integration.mts",
    "scripts/ops/verify/verify-meta-ad-landing.mts",
    "scripts/ops/verify/verify-meta-pixel.mts",
    ".env.local.example",
    "docs/Vibe_Music_Meta_Pixel_CAPI_Setup.md",
  ];

  for (const file of requiredFiles) {
    checks.push(
      exists(file) ? pass(`file:${file}`, "present") : fail(`file:${file}`, "missing"),
    );
  }

  checks.push(
    fileIncludes("src/proxy.ts", "resolveAdLandingRedirect")
      ? pass("proxy:brand-redirect", "edge 308 redirects for ?brand=")
      : fail("proxy:brand-redirect", "missing"),
  );

  checks.push(
    fileIncludes("src/lib/server/orderPaymentService.ts", "sendServerMetaPurchaseEvent")
      ? pass("capi:purchase-server", "server Purchase on payment capture")
      : fail("capi:purchase-server", "missing"),
  );

  checks.push(
    fileIncludes("src/lib/analytics/events.ts", "trackMetaInitiateCheckout")
      ? pass("events:initiate-checkout", "wired from trackBeginCheckout")
      : fail("events:initiate-checkout", "missing"),
  );

  checks.push(
    fileIncludes("src/lib/site.ts", "facebook-domain-verification")
      ? pass("site:domain-tag", "domain verification metadata")
      : fail("site:domain-tag", "missing"),
  );

  const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, "package.json"), "utf8")) as {
    scripts?: Record<string, string>;
  };
  for (const script of [
    "verify:meta-integration",
    "verify:meta-pixel:prod",
    "verify:meta-ad-landing:prod",
  ]) {
    checks.push(
      pkg.scripts?.[script]
        ? pass(`npm:${script}`, "defined")
        : fail(`npm:${script}`, "missing from package.json"),
    );
  }

  for (const envKey of [
    "NEXT_PUBLIC_META_PIXEL_ID",
    "META_CAPI_ACCESS_TOKEN",
    "NEXT_PUBLIC_META_DOMAIN_VERIFICATION",
  ]) {
    checks.push(
      fileIncludes("deploy/ops-secrets.env.example", envKey)
        ? pass(`env-example:${envKey}`, "documented")
        : fail(`env-example:${envKey}`, "missing from ops-secrets.env.example"),
    );
  }

  console.log("\nMeta Pixel + CAPI — deployment readiness (code only)\n");
  for (const check of checks) {
    console.log(`${check.ok ? "OK  " : "FAIL"}  ${check.name.padEnd(36)} ${check.detail}`);
  }

  const failed = checks.filter((c) => !c.ok);
  if (failed.length > 0) {
    console.error(`\n${failed.length} check(s) failed — not deployment-ready.\n`);
    process.exit(1);
  }

  console.log("\nAll deployment-readiness checks passed.");
  console.log("Next (operator): add Meta credentials → deploy/ops-secrets.env → bash deploy/update.sh\n");
}

main();
