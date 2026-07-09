/**
 * Mobile responsive audit — runs in Playwright at phone/tablet widths.
 * Writes NDJSON to debug-9cd558.log
 */
import { appendFileSync } from "fs";
import { join } from "path";

const LOG_PATH = join(process.cwd(), "debug-9cd558.log");
const BASE = process.env.MOBILE_AUDIT_BASE ?? "http://localhost:3000";
const SESSION_ID = "9cd558";

const VIEWPORTS = [
  { name: "iphone-se", width: 375, height: 667 },
  { name: "iphone-14", width: 390, height: 844 },
  { name: "tablet", width: 768, height: 1024 },
];

const PAGES = [
  "/",
  "/category/guitars",
  "/search/results?q=guitar",
  "/cart",
  "/checkout",
];

function writeLog(entry) {
  appendFileSync(
    LOG_PATH,
    `${JSON.stringify({ sessionId: SESSION_ID, timestamp: Date.now(), ...entry })}\n`
  );
}

async function auditPage(page, path, viewport) {
  await page.setViewportSize({ width: viewport.width, height: viewport.height });
  await page.goto(`${BASE}${path}`, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForTimeout(1200);

  const result = await page.evaluate((pathname) => {
    const viewportWidth = window.innerWidth;
    const clientWidth = document.documentElement.clientWidth;
    const scrollWidth = document.documentElement.scrollWidth;
    const overflowPx = Math.max(0, scrollWidth - clientWidth);
    const issues = [];

    if (overflowPx > 1) {
      const offenders = Array.from(document.querySelectorAll("body *"))
        .filter((el) => el.getBoundingClientRect().right > clientWidth + 1)
        .slice(0, 5)
        .map((el) => ({
          tag: el.tagName.toLowerCase(),
          className: (el.className?.toString?.() ?? "").slice(0, 80),
          right: Math.round(el.getBoundingClientRect().right),
        }));
      issues.push({
        hypothesisId: "H1",
        type: "horizontal-overflow",
        message: `Overflow ${overflowPx}px`,
        offenders,
      });
    }

    const interactives = Array.from(
      document.querySelectorAll(
        'button, a[href], input, .site-header__menu-btn, .site-header__action, .pdp-mobile-bar__cta, .checkout-mobile-bar__cta'
      )
    ).filter((el) => {
      const s = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      return s.display !== "none" && s.visibility !== "hidden" && r.width > 0;
    });

    const small = interactives
      .map((el) => {
        const r = el.getBoundingClientRect();
        return {
          cls: (el.className?.toString?.() ?? el.tagName).slice(0, 60),
          w: Math.round(r.width),
          h: Math.round(r.height),
          min: Math.round(Math.min(r.width, r.height)),
        };
      })
      .filter((t) => t.min > 0 && t.min < 44)
      .slice(0, 8);

    if (small.length) {
      issues.push({
        hypothesisId: "H2",
        type: "small-touch-target",
        message: `${small.length} targets < 44px`,
        small,
      });
    }

    const sticky = document.querySelector(".pdp-mobile-bar, .checkout-mobile-bar");
    if (sticky) {
      const bar = sticky.getBoundingClientRect();
      const page = document.querySelector(".pdp, .checkout-page");
      const pad = parseFloat(getComputedStyle(page ?? document.body).paddingBottom || "0");
      if (pad < 72) {
        issues.push({
          hypothesisId: "H3",
          type: "sticky-bar-padding",
          message: "Insufficient bottom padding for sticky bar",
          paddingBottom: pad,
          barTop: Math.round(bar.top),
        });
      }
    }

    const fixed = [
      ".help-widget__trigger",
      ".back-to-top",
      ".pdp-mobile-bar",
      ".checkout-mobile-bar",
    ]
      .map((sel) => document.querySelector(sel))
      .filter(Boolean);

    for (let i = 0; i < fixed.length; i++) {
      for (let j = i + 1; j < fixed.length; j++) {
        const a = fixed[i].getBoundingClientRect();
        const b = fixed[j].getBoundingClientRect();
        const overlap =
          a.width > 0 &&
          b.width > 0 &&
          !(a.right <= b.left || a.left >= b.right || a.bottom <= b.top || a.top >= b.bottom);
        if (overlap) {
          issues.push({
            hypothesisId: "H4",
            type: "fixed-ui-collision",
            message: "Fixed elements overlap",
            a: fixed[i].className?.toString?.().slice(0, 50),
            b: fixed[j].className?.toString?.().slice(0, 50),
          });
        }
      }
    }

    if (viewportWidth <= 1023) {
      const search = document.querySelector(".site-header__search--bar");
      if (search && getComputedStyle(search).display !== "none") {
        issues.push({
          hypothesisId: "H5",
          type: viewportWidth <= 767 ? "search-on-phone" : "search-on-tablet",
          message: "Inline search visible in compact header",
          viewportWidth,
        });
      }
    }

    return {
      pathname,
      viewportWidth,
      viewportHeight: window.innerHeight,
      hasHorizontalOverflow: overflowPx > 1,
      overflowPx,
      issues,
    };
  }, path);

  writeLog({
    runId: process.env.MOBILE_AUDIT_RUN ?? "playwright-baseline",
    location: "scripts/mobile-audit.mjs",
    message: "mobile-responsive-audit",
    data: { viewport: viewport.name, ...result },
  });

  return result;
}

async function main() {
  const { chromium } = await import("playwright");
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  let totalIssues = 0;
  for (const viewport of VIEWPORTS) {
    for (const path of PAGES) {
      try {
        const result = await auditPage(page, path, viewport);
        totalIssues += result.issues.length;
        console.log(
          `[${viewport.name}] ${path}: ${result.issues.length} issue(s)${
            result.hasHorizontalOverflow ? ` (overflow ${result.overflowPx}px)` : ""
          }`
        );
      } catch (err) {
        writeLog({
          runId: "playwright-baseline",
          location: "scripts/mobile-audit.mjs",
          message: "audit-error",
          data: { viewport: viewport.name, path, error: String(err) },
        });
        console.error(`[${viewport.name}] ${path}: ERROR`, err.message);
      }
    }

    // Open mobile nav on homepage
    try {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded", timeout: 60000 });
      const menuBtn = page.locator(".site-header__menu-btn");
      if (await menuBtn.count()) {
        await menuBtn.click();
        await page.waitForTimeout(400);
        const navOpen = await page.evaluate(() => {
          const nav = document.querySelector(".site-header__nav");
          return nav?.getAttribute("aria-hidden") !== "true";
        });
        writeLog({
          runId: "playwright-baseline",
          location: "scripts/mobile-audit.mjs",
          message: "mobile-nav-toggle",
          data: { viewport: viewport.name, navOpen },
          hypothesisId: "H5",
        });
      }
    } catch (err) {
      console.error(`[${viewport.name}] nav test:`, err.message);
    }
  }

  await browser.close();
  console.log(`\nAudit complete. Total issues logged: ${totalIssues}`);
  console.log(`Log file: ${LOG_PATH}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
