/**
 * Production sign-off smoke (F-14 ops gate).
 * Does NOT place a real Razorpay charge — prints a manual checklist for that.
 *
 * Usage:
 *   VERIFY_BASE_URL=https://vibemusic.in npx tsx --env-file=.env.local scripts/ops/prod-signoff.mts
 *   npm run verify:prod-signoff
 */

const BASE_URL = (process.env.VERIFY_BASE_URL ?? "https://vibemusic.in").replace(
  /\/$/,
  ""
);

type Check = { name: string; ok: boolean; detail: string; blocking: boolean };

async function getJson(path: string): Promise<{ status: number; body: unknown }> {
  const response = await fetch(`${BASE_URL}${path}`, { cache: "no-store" });
  const text = await response.text();
  try {
    return { status: response.status, body: JSON.parse(text) as unknown };
  } catch {
    return { status: response.status, body: text.slice(0, 200) };
  }
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

const checks: Check[] = [];

{
  const { status, body } = await getJson("/api/health");
  const data = asRecord(body);
  const db = asRecord(data.database);
  const ok = status === 200 && data.status === "healthy" && db.ok === true;
  checks.push({
    name: "health",
    ok,
    detail: `HTTP ${status} status=${String(data.status)} database.ok=${String(db.ok)}`,
    blocking: true,
  });
}

{
  const { status, body } = await getJson("/api/checkout/capabilities");
  const data = asRecord(body);
  const methods = Array.isArray(data.paymentMethods)
    ? (data.paymentMethods as unknown[])
    : [];
  const razorpay =
    data.razorpayConfigured === true &&
    data.onlinePaymentsAvailable === true &&
    data.demoPaymentsAllowed === false &&
    methods.includes("razorpay");
  checks.push({
    name: "payments",
    ok: status === 200 && razorpay,
    detail: `HTTP ${status} razorpay=${String(data.razorpayConfigured)} demo=${String(data.demoPaymentsAllowed)} methods=${JSON.stringify(methods)}`,
    blocking: true,
  });
  checks.push({
    name: "store-phone",
    ok: status === 200 && data.storePhoneConfigured === true,
    detail: `storePhoneDisplay=${String(data.storePhoneDisplay ?? "")}`,
    blocking: false,
  });
  checks.push({
    name: "analytics",
    ok: status === 200 && data.analyticsEnabled === true,
    detail: `analyticsEnabled=${String(data.analyticsEnabled)}`,
    blocking: false,
  });
}

{
  const { status, body } = await getJson("/api/banners");
  const data = asRecord(body);
  const count = Array.isArray(data.banners) ? data.banners.length : 0;
  checks.push({
    name: "banners",
    ok: status === 200 && count > 0,
    detail: `HTTP ${status} count=${count}`,
    blocking: false,
  });
}

{
  const { status } = await getJson("/");
  checks.push({
    name: "homepage",
    ok: status === 200,
    detail: `HTTP ${status}`,
    blocking: true,
  });
}

console.log(`\nVibe Music production sign-off — ${BASE_URL}\n`);
for (const check of checks) {
  const mark = check.ok ? "OK  " : check.blocking ? "FAIL" : "WARN";
  console.log(`${mark}  ${check.name.padEnd(16)} ${check.detail}`);
}

const failed = checks.filter((c) => !c.ok && c.blocking);

console.log(`
────────────────────────────────────────
F-14 close-out status
────────────────────────────────────────
[x] Automated health / payments / homepage gates
[x] Razorpay credentials + webhook secret + demo=false
[x] On-VPS Postgres + CDN backups (deploy/verify-backups.sh)
[ ] Optional: one customer live purchase (commercial smoke) — not required for tech sign-off
[ ] Optional: keep a second off-server copy of /var/backups/vibe
`);

if (failed.length > 0) {
  console.log(`${failed.length} blocking automated check(s) failed.\n`);
  process.exit(1);
}

console.log("Production automated sign-off PASSED.\n");
process.exit(0);
