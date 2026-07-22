/**
 * Lightweight Lighthouse audit helper with score gates.
 * Requires: npm run build && npm run start (in another terminal)
 * Usage: node scripts/ops/lighthouse-audit.mjs
 *
 * Env:
 *   LIGHTHOUSE_BASE_URL   default http://127.0.0.1:3000
 *   LIGHTHOUSE_FAIL       set to "true" to fail the process on threshold misses
 *   LIGHTHOUSE_MIN_PERF / A11Y / BP / SEO  (0-100, defaults below)
 */
import { spawn } from "node:child_process";
import { mkdir, readFile } from "node:fs/promises";

const baseUrl = process.env.LIGHTHOUSE_BASE_URL ?? "http://127.0.0.1:3000";
const failOnThreshold = process.env.LIGHTHOUSE_FAIL === "true";
const urls = (process.env.LIGHTHOUSE_URLS ?? "/,/contact,/cart")
  .split(",")
  .map((u) => u.trim())
  .filter(Boolean);

const thresholds = {
  performance: Number(process.env.LIGHTHOUSE_MIN_PERF ?? 50),
  accessibility: Number(process.env.LIGHTHOUSE_MIN_A11Y ?? 85),
  "best-practices": Number(process.env.LIGHTHOUSE_MIN_BP ?? 80),
  seo: Number(process.env.LIGHTHOUSE_MIN_SEO ?? 85),
};

await mkdir("reports/lighthouse", { recursive: true });

const failures = [];

for (const path of urls) {
  const slug = path === "/" ? "home" : path.replace(/\//g, "-").replace(/^-/, "");
  const out = `reports/lighthouse/${slug}.json`;
  const url = `${baseUrl}${path}`;
  console.log(`Auditing ${url}…`);

  await new Promise((resolve, reject) => {
    const child = spawn(
      "npx",
      [
        "lighthouse",
        url,
        "--quiet",
        "--chrome-flags=--headless --no-sandbox",
        `--output=json`,
        `--output-path=${out}`,
        "--only-categories=performance,accessibility,best-practices,seo",
      ],
      { stdio: "inherit", shell: true }
    );
    child.on("exit", (code) =>
      code === 0 ? resolve(undefined) : reject(new Error(`Lighthouse failed for ${url}`))
    );
  });

  const report = JSON.parse(await readFile(out, "utf8"));
  const categories = report.categories ?? {};
  for (const [id, min] of Object.entries(thresholds)) {
    const score = Math.round((categories[id]?.score ?? 0) * 100);
    const line = `${slug} ${id}: ${score} (min ${min})`;
    console.log(line);
    if (score < min) {
      failures.push(line);
    }
  }
}

console.log("Lighthouse reports written to reports/lighthouse/");
if (failures.length) {
  console.error("Lighthouse threshold failures:\n" + failures.join("\n"));
  if (failOnThreshold) {
    process.exit(1);
  }
}
