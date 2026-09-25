/**
 * Core Web Vitals / Lighthouse baseline gate (L-14).
 *
 * Requires a running server: npm run build && npm run start
 *
 * Usage:
 *   npm run check:cwv
 *   LIGHTHOUSE_BASE_URL=http://127.0.0.1:3000 LIGHTHOUSE_FAIL=true npm run check:cwv
 */
import { spawnSync } from "node:child_process";

const baseUrl = process.env.LIGHTHOUSE_BASE_URL ?? "http://127.0.0.1:3000";
const urls = process.env.CWV_URLS ?? "/,/product/guitar,/cart,/checkout,/deals";

console.log(`CWV baseline check — ${baseUrl}`);
console.log(`Pages: ${urls}`);

const result = spawnSync(
  "node",
  ["scripts/ops/lighthouse-audit.mjs"],
  {
    stdio: "inherit",
    env: {
      ...process.env,
      LIGHTHOUSE_BASE_URL: baseUrl,
      LIGHTHOUSE_URLS: urls,
      LIGHTHOUSE_FAIL: process.env.LIGHTHOUSE_FAIL ?? "true",
      LIGHTHOUSE_MIN_PERF: process.env.LIGHTHOUSE_MIN_PERF ?? "45",
      LIGHTHOUSE_MIN_A11Y: process.env.LIGHTHOUSE_MIN_A11Y ?? "85",
      LIGHTHOUSE_MIN_BP: process.env.LIGHTHOUSE_MIN_BP ?? "80",
      LIGHTHOUSE_MIN_SEO: process.env.LIGHTHOUSE_MIN_SEO ?? "85",
    },
    shell: process.platform === "win32",
  },
);

process.exit(result.status ?? 1);
