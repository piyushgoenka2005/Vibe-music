/**
 * Production CWV gate — 90+ on all Lighthouse categories (L-14).
 * Requires production build: npm run build && npm run start
 */
import { spawnSync } from "node:child_process";

const result = spawnSync("node", ["scripts/ops/check-cwv.mjs"], {
  stdio: "inherit",
  env: {
    ...process.env,
    LIGHTHOUSE_MIN_PERF: process.env.LIGHTHOUSE_MIN_PERF ?? "90",
    LIGHTHOUSE_MIN_A11Y: process.env.LIGHTHOUSE_MIN_A11Y ?? "90",
    LIGHTHOUSE_MIN_BP: process.env.LIGHTHOUSE_MIN_BP ?? "90",
    LIGHTHOUSE_MIN_SEO: process.env.LIGHTHOUSE_MIN_SEO ?? "90",
    LIGHTHOUSE_FAIL: "true",
  },
  shell: process.platform === "win32",
});

process.exit(result.status ?? 1);
