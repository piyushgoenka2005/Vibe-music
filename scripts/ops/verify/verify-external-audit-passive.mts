/**
 * Passive external-audit checks (Appendix A style) against VERIFY_BASE_URL.
 * Does not crawl checkout or authenticated routes.
 *
 * Usage: VERIFY_BASE_URL=https://vibemusic.in npx tsx scripts/ops/verify/verify-external-audit-passive.mts
 */

const BASE = (process.env.VERIFY_BASE_URL ?? "https://vibemusic.in").replace(/\/$/, "");

type Row = { name: string; ok: boolean; detail: string };

function visibleWordCount(html: string): number {
  const text = html.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<[^>]+>/g, " ");
  return text.split(/\s+/).filter(Boolean).length;
}

async function fetchText(path: string): Promise<{ status: number; html: string }> {
  const response = await fetch(`${BASE}${path}`, { cache: "no-store" });
  return { status: response.status, html: await response.text() };
}

const rows: Row[] = [];

for (const slug of ["privacy", "terms", "returns", "shipping"]) {
  const { status, html } = await fetchText(`/pages/${slug}`);
  const words = visibleWordCount(html);
  rows.push({
    name: `policy:${slug}`,
    ok: status === 200 && words >= 200,
    detail: `HTTP ${status} words≈${words}`,
  });
}

{
  const { status, html } = await fetchText("/");
  rows.push({
    name: "legacy-phone-absent",
    ok: status === 200 && !/977[\s-]?365[\s-]?1006|919773651006/i.test(html),
    detail: status === 200 ? "no legacy 9773651006 in HTML" : `HTTP ${status}`,
  });
  rows.push({
    name: "security-headers",
    ok:
      Boolean((await fetch(`${BASE}/`, { cache: "no-store" })).headers.get("content-security-policy")) &&
      Boolean((await fetch(`${BASE}/`, { cache: "no-store" })).headers.get("strict-transport-security")),
    detail: "CSP + HSTS on homepage",
  });
}

{
  const res = await fetch(`${BASE}/login?redirect=//example.com`, {
    redirect: "manual",
    cache: "no-store",
  });
  const location = res.headers.get("location") ?? "";
  rows.push({
    name: "open-redirect-login",
    ok: !location.includes("example.com"),
    detail: `HTTP ${res.status} location=${location || "none"}`,
  });
}

{
  const res = await fetch(`${BASE}/brands?brand=gibraltar`, { redirect: "manual", cache: "no-store" });
  const location = res.headers.get("location") ?? "";
  rows.push({
    name: "brand-query-redirect",
    ok: res.status >= 300 && res.status < 400 && location.includes("/brands/gibraltar"),
    detail: `HTTP ${res.status} location=${location || "none"}`,
  });
}

{
  const { status, html } = await fetchText("/api/coupons/active");
  rows.push({
    name: "coupons-active",
    ok: status === 200 && html.includes('"coupons"'),
    detail: `HTTP ${status}`,
  });
}

console.log(`\nPassive external audit — ${BASE}\n`);
for (const row of rows) {
  console.log(`${row.ok ? "OK  " : "FAIL"}  ${row.name.padEnd(22)} ${row.detail}`);
}

const failed = rows.filter((row) => !row.ok);
if (failed.length > 0) {
  console.log(`\n${failed.length} check(s) failed.\n`);
  process.exit(1);
}

console.log("\nPassive external audit PASSED.\n");
