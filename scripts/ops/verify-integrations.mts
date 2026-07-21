/**
 * Smoke-test local integrations and public API routes.
 * Usage: npm run verify:integrations
 */

const BASE_URL = process.env.VERIFY_BASE_URL ?? "http://localhost:3000";

type CheckResult = { name: string; ok: boolean; detail: string };

function envOk(name: string): CheckResult {
  if (name === "SMTP_PASS") {
    const ok = Boolean(
      process.env.SMTP_PASS?.trim() || process.env.RESEND_API_KEY?.trim()
    );
    return {
      name: `env:${name}`,
      ok,
      detail: process.env.SMTP_PASS?.trim()
        ? "set"
        : process.env.RESEND_API_KEY?.trim()
          ? "set via RESEND_API_KEY"
          : "missing",
    };
  }
  if (name === "SMTP_HOST" || name === "SMTP_USER") {
    const direct = Boolean(process.env[name]?.trim());
    const viaResend = Boolean(process.env.RESEND_API_KEY?.trim());
    const ok = direct || viaResend;
    return {
      name: `env:${name}`,
      ok,
      detail: direct ? "set" : viaResend ? "set via RESEND_API_KEY" : "missing",
    };
  }
  const value = process.env[name];
  const ok = Boolean(value?.trim());
  return {
    name: `env:${name}`,
    ok,
    detail: ok ? "set" : "missing",
  };
}

async function fetchCheck(path: string): Promise<CheckResult> {
  const url = `${BASE_URL}${path}`;
  try {
    const response = await fetch(url, { cache: "no-store" });
    const text = await response.text();
    let detail = `HTTP ${response.status}`;
    if (path === "/api/health") {
      try {
        const json = JSON.parse(text) as {
          status?: string;
          checks?: Record<string, string>;
          integrations?: Record<string, string>;
        };
        detail = `${json.status ?? "unknown"} database=${json.checks?.database ?? "?"} integrations=${JSON.stringify(json.integrations ?? {})}`;
      } catch {
        detail = `HTTP ${response.status} (invalid JSON)`;
      }
    } else if (path === "/api/banners") {
      try {
        const json = JSON.parse(text) as { banners?: unknown[] };
        detail = `HTTP ${response.status} banners=${json.banners?.length ?? 0}`;
      } catch {
        detail = `HTTP ${response.status}`;
      }
    } else if (path === "/blog") {
      detail = response.ok
        ? `HTTP ${response.status} (check /blog for published posts)`
        : `HTTP ${response.status}`;
    } else if (path === "/api/homepage") {
      try {
        const json = JSON.parse(text) as { sections?: unknown[] };
        detail = `HTTP ${response.status} sections=${json.sections?.length ?? 0}`;
      } catch {
        detail = `HTTP ${response.status}`;
      }
    }
    return { name: path, ok: response.ok, detail };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { name: path, ok: false, detail: message };
  }
}

const envChecks = [
  "DATABASE_URL",
  "AUTH_SECRET",
  "GUEST_ORDER_ACCESS_SECRET",
  "RAZORPAY_KEY_ID",
  "RAZORPAY_KEY_SECRET",
  "NEXT_PUBLIC_RAZORPAY_KEY_ID",
  "RAZORPAY_WEBHOOK_SECRET",
  "SMTP_HOST",
  "SMTP_USER",
  "SMTP_PASS",
  "AUTH_GOOGLE_ID",
  "AUTH_GOOGLE_SECRET",
  "CDN_STORAGE_ROOT",
  "CDN_PUBLIC_BASE_URL",
].map(envOk);

const optionalEnvChecks = [
  "NEXT_PUBLIC_GA_MEASUREMENT_ID",
  "GA_MEASUREMENT_API_SECRET",
  "GOOGLE_PLACES_API_KEY",
  "NEXT_PUBLIC_STORE_PHONE",
  "UPSTASH_REDIS_REST_URL",
].map((name) => {
  const result = envOk(name);
  return { ...result, name: `optional:${name}` };
});

const routeChecks = await Promise.all([
  fetchCheck("/api/health"),
  fetchCheck("/api/homepage"),
  fetchCheck("/api/banners"),
  fetchCheck("/api/search?q=guitar"),
  fetchCheck("/api/catalog/categories"),
  fetchCheck("/"),
  fetchCheck("/blog"),
  fetchCheck("/search"),
]);

const results = [...envChecks, ...optionalEnvChecks, ...routeChecks];
const failed = results.filter((result) => !result.ok && !result.name.startsWith("optional:"));

console.log(`\nVibe Music verification — ${BASE_URL}\n`);
for (const result of results) {
  const optional = result.name.startsWith("optional:");
  const mark = result.ok ? "OK " : optional ? "SKIP" : "FAIL";
  console.log(`${mark}  ${result.name.padEnd(42)} ${result.detail}`);
}

console.log(
  failed.length === 0
    ? "\nAll checks passed.\n"
    : `\n${failed.length} check(s) failed. Fix missing env vars or start the dev server on ${BASE_URL}.\n`
);

process.exit(failed.length === 0 ? 0 : 1);
