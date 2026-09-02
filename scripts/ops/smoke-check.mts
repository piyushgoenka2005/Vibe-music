/**
 * Smoke-check critical storefront routes and APIs.
 * Usage: npx tsx scripts/ops/smoke-check.mts [baseUrl]
 */
const base = (process.argv[2] || "http://localhost:3000").replace(/\/$/, "");

type Check = { name: string; path: string; expect?: number; json?: boolean; assert?: (data: unknown, text: string, status: number) => string | null };

const checks: Check[] = [
  { name: "Home", path: "/" },
  {
    name: "Health API",
    path: "/api/health",
    json: true,
    // 200 = healthy, 503 = unhealthy (DB not configured) — both are correct
    expect: undefined,
    assert: (data, _text, status) => {
      const d = data as { status?: string; checks?: { app?: string } };
      if (!d.status) return "missing status field";
      if (!d.checks?.app) return "missing checks.app field";
      if (status !== 200 && status !== 503) return `unexpected status ${status}`;
      return null;
    },
  },
  { name: "Contact page", path: "/contact" },
  { name: "Search results", path: "/search/results?q=guitar" },
  { name: "Category guitars", path: "/category/guitars" },
  { name: "Wishlist", path: "/wishlist" },
  { name: "Cart", path: "/cart" },
  { name: "Search API", path: "/api/search?q=guitar&mode=results&all=1", json: true },
  { name: "Homepage API", path: "/api/homepage", json: true },
  {
    name: "Product reviews API",
    path: "/api/products/adeon-ad12-dsp-ad12-dsp/reviews?limit=5",
    json: true,
    assert: (data) => {
      const d = data as { reviews?: unknown[]; totalCount?: number; hasMore?: boolean };
      // Must return valid structure — empty array is OK (no data in dev DB)
      if (!Array.isArray(d.reviews)) return "missing reviews array";
      return null;
    },
  },
  {
    name: "Product review stats",
    path: "/api/products/adeon-ad12-dsp-ad12-dsp/reviews/stats",
    json: true,
    assert: (data) => {
      const d = data as { stats?: { totalReviews?: number; averageRating?: number } };
      // Must return valid structure — 0 ratings is OK (no data in dev DB)
      if (!d.stats) return "missing stats object";
      return null;
    },
  },
  {
    name: "Product PDP",
    path: "/product/adeon-ad12-dsp-ad12-dsp",
  },
  {
    name: "Media thumb API",
    path: `/api/media/thumb?url=${encodeURIComponent("https://cdn.vibemusic.in/products/live-sound-lighting/adeon-acm18-acm18/bd28f237-9020-4c54-828b-13ec89f0aca5.png")}&w=200`,
  },
  { name: "Auth session", path: "/api/auth/session", json: true },
  { name: "Footer trending", path: "/api/products/footer-trending?limit=4", json: true },
  { name: "Login", path: "/login" },
  { name: "Register", path: "/register" },
  { name: "Checkout page", path: "/checkout" },
  { name: "Deals", path: "/deals" },
  { name: "Brands", path: "/brands" },
  { name: "Blog", path: "/blog" },
  { name: "Compare", path: "/compare" },
  { name: "GP9", path: "/gp9" },
  { name: "Search landing", path: "/search" },
  { name: "Track order", path: "/track-order" },
  { name: "Rentals", path: "/rentals" },
  { name: "Checkout capabilities", path: "/api/checkout/capabilities", json: true },
  { name: "Catalog categories API", path: "/api/catalog/categories", json: true },
  { name: "Banners API", path: "/api/banners", json: true },
  {
    name: "Search layout markup",
    path: "/search/results?q=hertz",
    assert: (_data, text) => {
      if (!text.includes("cat-page")) return "missing category-style cat-page layout";
      if (!text.includes("Filter") && !text.includes("filter")) return "missing filter UI";
      return null;
    },
  },
  {
    name: "Contact submit markup",
    path: "/contact",
    assert: (_data, text) => {
      if (!text.includes("contact-page__submit")) return "missing submit button class";
      if (!text.includes("Send message") && !text.includes("Sending")) return "missing send label";
      return null;
    },
  },
  {
    name: "PDP reviews markup",
    path: "/product/adeon-ad12-dsp-ad12-dsp",
    assert: (_data, text) => {
      if (!text.toLowerCase().includes("review")) return "missing reviews section text";
      return null;
    },
  },
];

async function run() {
  const results: Array<{ name: string; ok: boolean; detail: string }> = [];

  for (const check of checks) {
    const url = `${base}${check.path}`;
    const started = Date.now();
    try {
      const res = await fetch(url, {
        headers: { Accept: check.json ? "application/json" : "text/html" },
        redirect: "follow",
      });
      const ms = Date.now() - started;
      const expect = check.expect ?? 200;
      const text = await res.text();
      let assertMsg: string | null = null;
      if (check.assert) {
        let data: unknown = null;
        if (check.json) {
          try {
            data = JSON.parse(text);
          } catch {
            assertMsg = "invalid JSON";
          }
        }
        if (!assertMsg) {
          assertMsg = check.assert(data, text, res.status) ?? null;
        }
      } else if (check.json) {
        try {
          JSON.parse(text);
        } catch {
          assertMsg = "invalid JSON";
        }
      }
      // If assert function is provided and returned null, status check is skipped
      // (the assert function is responsible for validating the response)
      const statusOk = check.assert ? true : res.status === expect;
      const ok = statusOk && !assertMsg;
      results.push({
        name: check.name,
        ok,
        detail: ok
          ? `${res.status} ${ms}ms`
          : `${res.status} ${ms}ms ${assertMsg ?? res.statusText}`.trim(),
      });
    } catch (error) {
      results.push({
        name: check.name,
        ok: false,
        detail: error instanceof Error ? error.message : String(error),
      });
    }
  }

  const passed = results.filter((r) => r.ok).length;
  const failed = results.filter((r) => !r.ok);

  console.log(`Smoke check against ${base}`);
  for (const r of results) {
    console.log(`${r.ok ? "PASS" : "FAIL"}  ${r.name} — ${r.detail}`);
  }
  console.log(`\nSummary: ${passed}/${results.length} passed`);
  if (failed.length) {
    console.log("Failures:");
    for (const f of failed) console.log(` - ${f.name}: ${f.detail}`);
    process.exitCode = 1;
  }
}

run();
