/**
 * Logs in as an admin and GETs every static admin page + admin API route.
 *
 * Usage:
 *   npm run verify:admin-smoke
 * Env:
 *   BASE_URL (default http://localhost:3000)
 *   ADMIN_EMAIL / ADMIN_PASSWORD (default: seeded E2E admin — `npm run seed:e2e-admin`)
 *   SLOW_MS (default 1500)
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";

const BASE_URL = (process.env.BASE_URL ?? "http://localhost:3000").replace(/\/$/, "");
const EMAIL = process.env.ADMIN_EMAIL ?? "e2e-admin@vibemusic.test";
const PASSWORD = process.env.ADMIN_PASSWORD ?? "E2eAdminPassword!123456";
const SLOW_MS = Number(process.env.SLOW_MS ?? 1500);

/** Routes that stream, export files, or need query params — checked elsewhere. */
const SKIP_API = new Set([
  "/api/admin/login",
  "/api/admin/logout",
  "/api/admin/notifications/stream",
  "/api/admin/products/export",
  "/api/admin/products/import/template",
  "/api/admin/orders/export",
  "/api/admin/customers/export",
  "/api/admin/rentals/blocks",
  "/api/admin/rentals/units",
]);

function walk(dir: string, file: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...walk(full, file));
    else if (entry === file) out.push(full);
  }
  return out;
}

function toRoute(appDir: string, file: string): string {
  const rel = path.relative(appDir, path.dirname(file)).split(path.sep).join("/");
  return `/${rel}`.replace(/\/\([^)]+\)/g, "");
}

async function login(): Promise<string> {
  const res = await fetch(`${BASE_URL}/api/admin/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: BASE_URL },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  });
  if (!res.ok) throw new Error(`Admin login failed: HTTP ${res.status} ${await res.text()}`);
  const cookies = res.headers.getSetCookie().map((c) => c.split(";")[0]);
  return cookies.join("; ");
}

type Result = { route: string; status: number; ms: number; note?: string };

async function check(route: string, cookie: string, isApi: boolean): Promise<Result> {
  const started = performance.now();
  try {
    const res = await fetch(`${BASE_URL}${route}`, {
      headers: { cookie, ...(isApi ? { Accept: "application/json" } : {}) },
      redirect: "manual",
    });
    const text = await res.text();
    const ms = Math.round(performance.now() - started);
    let note: string | undefined;
    if (isApi && res.status >= 400) {
      try {
        note = (JSON.parse(text) as { error?: string }).error;
      } catch {
        note = text.slice(0, 120);
      }
    }
    return { route, status: res.status, ms, note };
  } catch (error) {
    return { route, status: 0, ms: Math.round(performance.now() - started), note: String(error) };
  }
}

async function main() {
  const appDir = path.resolve("src/app");
  const pages = walk(path.join(appDir, "admin"), "page.tsx")
    .map((f) => toRoute(appDir, f))
    .filter((r) => !r.includes("["));
  const apis = walk(path.join(appDir, "api", "admin"), "route.ts")
    .filter((f) =>
      /export\s+(async\s+)?function\s+GET|export\s+const\s+GET|export\s*\{[^}]*\bGET\b/.test(
        readFileSync(f, "utf8"),
      ),
    )
    .map((f) => toRoute(appDir, f))
    .filter((r) => !r.includes("[") && !SKIP_API.has(r));

  const cookie = await login();
  console.log(`Logged in as ${EMAIL} on ${BASE_URL}; ${pages.length} pages, ${apis.length} APIs`);

  const results: Result[] = [];
  for (const route of apis) results.push(await check(route, cookie, true));
  for (const route of pages) results.push(await check(route, cookie, false));

  const failed = results.filter((r) => r.status === 0 || r.status >= 400);
  const slow = results.filter((r) => r.ms > SLOW_MS && !failed.includes(r));
  for (const r of failed) console.log(`FAIL ${r.status} ${r.route} (${r.ms}ms) ${r.note ?? ""}`);
  for (const r of slow) console.log(`SLOW ${r.status} ${r.route} ${r.ms}ms`);
  const median = [...results].sort((a, b) => a.ms - b.ms)[Math.floor(results.length / 2)]?.ms;
  console.log(
    `\n${failed.length ? "FAIL" : "PASS"}: ${results.length - failed.length}/${results.length} ok, ${slow.length} slow (>${SLOW_MS}ms), median ${median}ms`,
  );
  process.exit(failed.length ? 1 : 0);
}

void main();
