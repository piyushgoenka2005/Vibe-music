/**
 * Lightweight Lighthouse audit helper.
 * Requires: npm run build && npm run start (in another terminal)
 * Usage: node scripts/lighthouse-audit.mjs
 */
import { spawn } from "node:child_process";
import { mkdir } from "node:fs/promises";

const baseUrl = process.env.LIGHTHOUSE_BASE_URL ?? "http://127.0.0.1:3000";
const urls = ["/", "/contact", "/pages/shipping", "/cart"];

await mkdir("reports/lighthouse", { recursive: true });

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
        "--chrome-flags=--headless",
        `--output=json`,
        `--output-path=${out}`,
        "--only-categories=performance,accessibility,best-practices,seo",
      ],
      { stdio: "inherit", shell: true }
    );
    child.on("exit", (code) => (code === 0 ? resolve(undefined) : reject(new Error(`Lighthouse failed for ${url}`))));
  });
}

console.log("Lighthouse reports written to reports/lighthouse/");
