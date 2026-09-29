/**
 * Verify production edge on CloudOnFire VPS (nginx + TLS + security headers).
 *
 * Usage:
 *   npm run check:edge
 *   VERIFY_BASE_URL=https://vibemusic.in node scripts/ops/check-edge-headers.mjs
 */
const baseUrl = (process.env.VERIFY_BASE_URL ?? "https://vibemusic.in").replace(/\/$/, "");
const cdnBase = (process.env.CDN_PUBLIC_BASE_URL ?? "https://cdn.vibemusic.in").replace(
  /\/$/,
  "",
);
const strictCdn = process.env.REQUIRE_CDN_EDGE === "true" || process.env.STRICT_CDN === "1";

function securityHeadersOk(headers) {
  const hsts = headers.get("strict-transport-security") ?? "";
  const csp = headers.get("content-security-policy") ?? "";
  const nosniff = headers.get("x-content-type-options") ?? "";
  return (
    hsts.includes("max-age=") && csp.includes("default-src") && nosniff.toLowerCase() === "nosniff"
  );
}

async function main() {
  const response = await fetch(`${baseUrl}/`, { redirect: "follow", cache: "no-store" });
  const headers = response.headers;
  const securityOk = securityHeadersOk(headers);
  const server = headers.get("server") ?? "(none)";

  let cdnOk = false;
  let cdnDetail = "not checked";
  try {
    const cdnResponse = await fetch(`${cdnBase}/`, {
      method: "HEAD",
      redirect: "follow",
      cache: "no-store",
    });
    cdnOk = cdnResponse.status > 0 && cdnResponse.status < 500;
    cdnDetail = `HTTP ${cdnResponse.status}`;
  } catch (error) {
    cdnDetail = error instanceof Error ? error.message : String(error);
  }

  console.log(`Production edge check — ${baseUrl}\n`);
  console.log(`  HTTP status            ${response.status}`);
  console.log(`  server (nginx)         ${server}`);
  console.log(`  HSTS                   ${headers.get("strict-transport-security") ? "present" : "missing"}`);
  console.log(`  CSP                    ${headers.get("content-security-policy") ? "present" : "missing"}`);
  console.log(
    `  X-Content-Type-Options ${headers.get("x-content-type-options") ?? "missing"}`,
  );
  console.log(`  CDN static host        ${cdnBase} → ${cdnDetail}`);

  let exitCode = 0;
  if (response.status !== 200) {
    console.log("\nBLOCKING: homepage did not return HTTP 200.");
    exitCode = 1;
  }
  if (!securityOk) {
    console.log("\nBLOCKING: baseline security headers are missing on the homepage.");
    exitCode = 1;
  }
  if (!cdnOk) {
    const msg =
      "\nWARN: CDN static host is not reachable — check DNS for cdn.vibemusic.in and /var/www/cdn on the VPS.";
    if (strictCdn) {
      console.log(msg.replace("WARN:", "BLOCKING:"));
      exitCode = exitCode || 1;
    } else {
      console.log(msg);
      console.log("See docs/ops/CLOUDONFIRE-SETUP.md");
    }
  }

  if (exitCode === 0) {
    console.log("\nProduction edge checks passed (CloudOnFire VPS + nginx).");
  }

  process.exit(exitCode);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
