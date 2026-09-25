#!/usr/bin/env npx tsx
/**
 * Live probes for production scorecard items 15, 17, 20 (Phase 8+).
 *
 * Usage:
 *   VERIFY_BASE_URL=https://vibemusic.in npm run verify:readiness
 */
import { spawnSync } from "node:child_process";

const BASE_URL = (process.env.VERIFY_BASE_URL ?? "https://vibemusic.in").replace(/\/$/, "");

type Probe = { name: string; ok: boolean; detail: string; points: number };

const probes: Probe[] = [];

async function fetchHome(): Promise<{ status: number; html: string; headers: Headers }> {
  const response = await fetch(`${BASE_URL}/`, { cache: "no-store" });
  return { status: response.status, html: await response.text(), headers: response.headers };
}

{
  const home = await fetchHome();
  const gstin = home.html.match(/GSTIN:\s*([0-9A-Z]{15})/i);
  probes.push({
    name: "L-30 GSTIN in homepage HTML",
    ok: Boolean(gstin),
    detail: gstin ? gstin[1] : "missing — set NEXT_PUBLIC_GSTIN or admin store GSTIN",
    points: 1,
  });

  const edgeHeader = ["cf-ray", "x-vercel-id", "x-amz-cf-id", "cf-cache-status"].find((h) =>
    home.headers.get(h),
  );
  probes.push({
    name: "L-22 CDN edge marker",
    ok: Boolean(edgeHeader),
    detail: edgeHeader ? `${edgeHeader}=${home.headers.get(edgeHeader)}` : "no cf-ray",
    points: 1,
  });
}

{
  const result = spawnSync("npm", ["run", "monitor:checkout"], {
    env: { ...process.env, VERIFY_BASE_URL: BASE_URL },
    shell: process.platform === "win32",
    encoding: "utf8",
  });
  probes.push({
    name: "Synthetic checkout monitor",
    ok: result.status === 0,
    detail: result.status === 0 ? "passed" : "failed",
    points: 0,
  });
}

const CODE_BASELINE = 17;
const livePoints = probes.filter((p) => p.points > 0 && p.ok).reduce((sum, p) => sum + p.points, 0);
const overall = CODE_BASELINE + livePoints;

console.log(`\nProduction readiness probes — ${BASE_URL}\n`);
for (const probe of probes) {
  console.log(`${probe.ok ? "OK  " : "FAIL"}  ${probe.name} — ${probe.detail}`);
}

console.log(`
Live infra/compliance points: ${livePoints} / 3 (L-22, L-23, L-30)
Estimated overall score: ${overall} / 20 (code baseline ${CODE_BASELINE} + live ${livePoints})
L-23 origin firewall: verify on VPS after L-22 (not HTTP-probable)
Matrix: docs/ops/PRODUCTION_READINESS_SCORECARD.md
`);

const blocking = probes.filter((p) => !p.ok && p.name.startsWith("L-"));
process.exit(blocking.length === 0 && overall >= 18 ? 0 : 1);
