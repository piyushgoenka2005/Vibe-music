#!/usr/bin/env npx tsx
/**
 * load-test.mts - Zero-dependency load tester for Vibe Music
 * Validates 2K concurrent user target.
 *
 * Usage:
 *   npx tsx scripts/ops/load-test.mts               # 200 concurrent, 30s
 *   npx tsx scripts/ops/load-test.mts --concurrent 2000
 *   npx tsx scripts/ops/load-test.mts --duration 60
 *   npx tsx scripts/ops/load-test.mts --url https://vibemusic.in
 */

import http from "node:http";
import https from "node:https";
import { URL } from "node:url";

const args = process.argv.slice(2);
function flag(name: string, fallback: string): string {
  const idx = args.indexOf("--" + name);
  return idx !== -1 && args[idx + 1] ? args[idx + 1] : fallback;
}

const BASE_URL = flag("url", "http://127.0.0.1:3000");
const CONC = Math.max(1, parseInt(flag("concurrent", "200"), 10));
const DUR = Math.max(5, parseInt(flag("duration", "30"), 10));
const RAMP = Math.max(1, parseInt(flag("ramp", "5"), 10));

interface Endpoint {
  path: string;
  method: string;
  weight: number;
}

const ENDPOINTS: Endpoint[] = [
  { path: "/", method: "GET", weight: 30 },
  { path: "/api/homepage", method: "GET", weight: 20 },
  { path: "/api/products", method: "GET", weight: 15 },
  { path: "/api/products/yamaha-f310", method: "GET", weight: 10 },
  { path: "/api/search?q=guitar", method: "GET", weight: 10 },
  { path: "/api/catalog/categories", method: "GET", weight: 5 },
  { path: "/api/products/footer-trending", method: "GET", weight: 5 },
  { path: "/api/health", method: "GET", weight: 3 },
  { path: "/api/cart/promotions", method: "GET", weight: 2 },
];

const POOL: { path: string; method: string }[] = [];
for (const ep of ENDPOINTS) {
  for (let i = 0; i < ep.weight; i++) {
    POOL.push({ path: ep.path, method: ep.method });
  }
}

function pick() {
  return POOL[Math.floor(Math.random() * POOL.length)];
}

interface ReqResult {
  status: number;
  ms: number;
  bytes: number;
  error?: string;
}

function doReq(url: string): Promise<ReqResult> {
  return new Promise((resolve) => {
    const start = performance.now();
    const lib = new URL(url).protocol === "https:" ? https : http;
    const r = lib.request(
      url,
      {
        method: "GET",
        headers: { "User-Agent": "vibe-load-test/1.0" },
        timeout: 30000,
      },
      (res) => {
        let b = 0;
        res.on("data", (c: Buffer) => {
          b += c.length;
        });
        res.on("end", () =>
          resolve({
            status: res.statusCode ?? 0,
            ms: performance.now() - start,
            bytes: b,
          })
        );
      }
    );
    r.on("error", (e) =>
      resolve({
        status: 0,
        ms: performance.now() - start,
        error: e.message,
        bytes: 0,
      })
    );
    r.on("timeout", () => {
      r.destroy();
      resolve({
        status: 0,
        ms: performance.now() - start,
        error: "timeout",
        bytes: 0,
      });
    });
    r.end();
  });
}

let running = false;
const lats: number[] = [];
let errs = 0;
let ok = 0;
let bytes = 0;
const codes: Record<number, number> = {};

async function worker() {
  while (running) {
    const ep = pick();
    const r = await doReq(BASE_URL + ep.path);
    lats.push(r.ms);
    bytes += r.bytes;
    if (r.error || r.status >= 500) errs++;
    else ok++;
    codes[r.status] = (codes[r.status] || 0) + 1;
    // Small random jitter to simulate real user behavior
    await new Promise((res) => setTimeout(res, Math.random() * 50));
  }
}

async function main() {
  console.log("");
  console.log("== Vibe Music Load Test ==");
  console.log(
    "Target: " + BASE_URL + " | Concurrency: " + CONC + " | Duration: " + DUR + "s"
  );
  console.log("");

  // Pre-flight: check target is reachable
  const pf = await doReq(BASE_URL + "/api/health");
  if (pf.error && pf.status === 0) {
    console.error("Cannot reach target: " + pf.error);
    process.exit(1);
  }
  console.log(
    "Target reachable (HTTP " + pf.status + ", " + pf.ms.toFixed(0) + "ms)"
  );
  console.log("");

  running = true;

  // Gradual ramp-up
  const delay = (RAMP * 1000) / CONC;
  for (let i = 0; i < CONC; i++) {
    worker().catch(() => {});
    await new Promise((res) => setTimeout(res, delay));
  }

  console.log("All " + CONC + " users active");

  const ts = performance.now();
  const pi = setInterval(() => {
    const elapsed = (performance.now() - ts) / 1000;
    process.stdout.write(
      "\r" +
        elapsed.toFixed(0) +
        "s | " +
        lats.length +
        " req | " +
        (lats.length / elapsed).toFixed(1) +
        " req/s | err: " +
        errs
    );
  }, 5000);

  await new Promise((res) => setTimeout(res, DUR * 1000));

  running = false;
  clearInterval(pi);

  const totalTime = (performance.now() - ts) / 1000;
  const total = lats.length;

  console.log("");
  console.log("");
  console.log("=== Results ===");
  console.log("Total requests: " + total);
  console.log("Duration: " + totalTime.toFixed(1) + "s");
  console.log("Throughput: " + (total / totalTime).toFixed(1) + " req/s");
  console.log(
    "Success: " +
      ((ok / total) * 100).toFixed(1) +
      "% | Error: " +
      ((errs / total) * 100).toFixed(1) +
      "%"
  );
  console.log("Bytes: " + (bytes / 1024 / 1024).toFixed(2) + "MB");
  console.log("");

  // Latency percentiles
  console.log("Latency:");
  const sorted = [...lats].sort((a, b) => a - b);
  const pct = (p: number) =>
    sorted[Math.ceil((p / 100) * sorted.length) - 1] || 0;
  console.log(
    "  P50: " +
      pct(50).toFixed(0) +
      "ms | P90: " +
      pct(90).toFixed(0) +
      "ms | P95: " +
      pct(95).toFixed(0) +
      "ms | P99: " +
      pct(99).toFixed(0) +
      "ms"
  );
  console.log(
    "  Max: " +
      Math.max(...sorted).toFixed(0) +
      "ms | Mean: " +
      (lats.reduce((a, b) => a + b, 0) / total).toFixed(0) +
      "ms"
  );

  // Status code distribution
  console.log("");
  console.log("Status Codes:");
  for (const [code, count] of Object.entries(codes).sort(
    (a, b) => Number(a[0]) - Number(b[0])
  )) {
    console.log("  " + code + ": " + count);
  }

  // Verdict
  const p95 = pct(95);
  const errorRate = (errs / total) * 100;
  const rps = total / totalTime;
  let verdict = "PASS";
  const issues: string[] = [];
  if (p95 > 2000) {
    verdict = "WARN";
    issues.push("P95 (" + p95.toFixed(0) + "ms) > 2000ms");
  }
  if (errorRate > 5) {
    verdict = "FAIL";
    issues.push("Error rate (" + errorRate.toFixed(1) + "%) > 5%");
  }
  if (rps < 100) {
    verdict = "WARN";
    issues.push("Throughput (" + rps.toFixed(0) + " req/s) < 100");
  }

  console.log("");
  console.log("Verdict: " + verdict);
  for (const issue of issues) {
    console.log("  - " + issue);
  }
  console.log("");
}

main().catch((e) => {
  console.error("Crashed:", e);
  process.exit(1);
});
