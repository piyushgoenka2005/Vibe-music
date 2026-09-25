/**
 * Verify CDN/WAF edge indicators and baseline security headers on a live site.
 *
 * Usage:
 *   npm run check:edge
 *   VERIFY_BASE_URL=https://vibemusic.in node scripts/ops/check-edge-headers.mjs
 */
const baseUrl = (process.env.VERIFY_BASE_URL ?? "https://vibemusic.in").replace(/\/$/, "");

function hasCdnIndicator(headers) {
  const markers = [
    "cf-ray",
    "cf-cache-status",
    "x-vercel-id",
    "x-vercel-cache",
    "x-amz-cf-id",
    "x-cache",
    "x-served-by",
  ];
  return markers.some((name) => headers.get(name));
}

async function main() {
  const response = await fetch(`${baseUrl}/`, { redirect: "follow", cache: "no-store" });
  const headers = response.headers;

  const hsts = headers.get("strict-transport-security") ?? "";
  const csp = headers.get("content-security-policy") ?? "";
  const nosniff = headers.get("x-content-type-options") ?? "";
  const cdn = hasCdnIndicator(headers);

  console.log(`Edge header check — ${baseUrl}\n`);
  console.log(`  HTTP status           ${response.status}`);
  console.log(`  CDN/WAF indicator     ${cdn ? "present" : "MISSING (origin may be exposed)"}`);
  console.log(`  cf-ray                ${headers.get("cf-ray") ?? "(none)"}`);
  console.log(`  x-vercel-id           ${headers.get("x-vercel-id") ?? "(none)"}`);
  console.log(`  server                ${headers.get("server") ?? "(none)"}`);
  console.log(`  HSTS                  ${hsts ? "present" : "missing"}`);
  console.log(`  CSP                   ${csp ? "present" : "missing"}`);
  console.log(`  X-Content-Type-Options ${nosniff || "missing"}`);

  const securityOk =
    hsts.includes("max-age=") &&
    csp.includes("default-src") &&
    nosniff.toLowerCase() === "nosniff";

  let exitCode = 0;
  if (!securityOk) {
    console.log("\nBLOCKING: baseline security headers are missing on the homepage.");
    exitCode = 1;
  }
  if (!cdn) {
    console.log(
      "\nWARN: no CDN/WAF edge marker detected. Put vibemusic.in behind Cloudflare (or Vercel edge) and firewall the origin to CDN IPs only.",
    );
    console.log("See docs/ops/CDN_WAF_EDGE_CHECKLIST.md");
    exitCode = exitCode || 2;
  }

  if (exitCode === 0) {
    console.log("\nEdge and security header checks passed.");
  }

  process.exit(exitCode);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
