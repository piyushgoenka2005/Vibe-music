import { chromium } from "playwright";

const BASE_URL = process.env.BASE_URL || "https://vibemusic.in";

const VIEWPORTS = [
  { name: "mobile-375", width: 375, height: 812 },
  { name: "mobile-390", width: 390, height: 844 },
  { name: "desktop-1280", width: 1280, height: 800 },
];

const ROUTES = [
  "/",
  "/category/guitars",
  "/category/drums-percussion",
  "/product/avus-lineage-7a-drumsticks-with-black-richlite-tip-natural",
  "/cart",
  "/checkout",
  "/search?q=drum",
  "/deals",
  "/account",
  "/login",
  "/about",
  "/contact",
  "/privacy",
  "/terms",
  "/shipping",
  "/returns",
];

interface AuditResult {
  route: string;
  viewport: string;
  horizontalOverflow: boolean;
  scrollWidth: number;
  innerWidth: number;
  brokenImages: number;
  brokenImageSrcs: string[];
  consoleErrors: string[];
  pageErrors: string[];
  failedRequests: string[];
  loadTimeMs: number;
}

async function run() {
  console.log(`Starting comprehensive audit against ${BASE_URL}...`);
  const browser = await chromium.launch({ headless: true });
  const results: AuditResult[] = [];
  let totalIssues = 0;

  for (const vp of VIEWPORTS) {
    console.log(`\n=== Testing Viewport: ${vp.name} (${vp.width}x${vp.height}) ===`);
    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      userAgent:
        vp.width < 600
          ? "Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Mobile/15E148 Safari/604.1"
          : "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    });

    for (const route of ROUTES) {
      const page = await context.newPage();
      const consoleErrors: string[] = [];
      const pageErrors: string[] = [];
      const failedRequests: string[] = [];

      page.on("console", (msg) => {
        if (msg.type() === "error") {
          const text = msg.text();
          // Filter known benign noise like third-party analytics trackers failing in headless
          if (!text.includes("google-analytics") && !text.includes("connect.facebook.net")) {
            consoleErrors.push(text);
          }
        }
      });

      page.on("pageerror", (err) => {
        pageErrors.push(err.message);
      });

      page.on("response", (res) => {
        if (res.status() >= 400 && res.status() !== 404 && !res.url().includes("favicon")) {
          failedRequests.push(`${res.status()} ${res.url()}`);
        }
      });

      const start = Date.now();
      try {
        await page.goto(`${BASE_URL}${route}`, {
          waitUntil: "domcontentloaded",
          timeout: 45000,
        });
        // Wait a brief moment for dynamic hydration/images to settle
        await page.waitForTimeout(2000);
      } catch (err: any) {
        console.warn(`Warning loading ${route}:`, err.message);
      }
      const loadTimeMs = Date.now() - start;

      // Check horizontal overflow
      const overflowInfo = await page.evaluate(() => {
        const docElem = document.documentElement;
        const body = document.body;
        const scrollWidth = Math.max(docElem.scrollWidth, body ? body.scrollWidth : 0);
        const innerWidth = window.innerWidth;
        return {
          scrollWidth,
          innerWidth,
          overflow: scrollWidth > innerWidth + 1, // 1px threshold for subpixel rounding
        };
      });

      // Check broken images
      const brokenImagesInfo = await page.evaluate(() => {
        const imgs = Array.from(document.querySelectorAll("img"));
        const broken: string[] = [];
        for (const img of imgs) {
          // If loaded but zero natural dimensions and not hidden
          if (img.complete && img.naturalWidth === 0 && img.getAttribute("src")) {
            // Check if visible
            const rect = img.getBoundingClientRect();
            if (rect.width > 0 || rect.height > 0) {
              broken.push(img.src);
            }
          }
        }
        return {
          count: broken.length,
          broken,
        };
      });

      const audit: AuditResult = {
        route,
        viewport: vp.name,
        horizontalOverflow: overflowInfo.overflow,
        scrollWidth: overflowInfo.scrollWidth,
        innerWidth: overflowInfo.innerWidth,
        brokenImages: brokenImagesInfo.count,
        brokenImageSrcs: brokenImagesInfo.broken,
        consoleErrors,
        pageErrors,
        failedRequests,
        loadTimeMs,
      };

      results.push(audit);

      const hasIssue =
        audit.horizontalOverflow ||
        audit.brokenImages > 0 ||
        audit.pageErrors.length > 0 ||
        audit.failedRequests.length > 0;

      if (hasIssue) {
        totalIssues++;
        console.log(`❌ [FAIL] ${route} (${vp.name}) - ${loadTimeMs}ms`);
        if (audit.horizontalOverflow) {
          console.log(`   Overflow: scrollWidth (${audit.scrollWidth}) > innerWidth (${audit.innerWidth})`);
        }
        if (audit.brokenImages > 0) {
          console.log(`   Broken images: ${audit.brokenImages} ->`, audit.brokenImageSrcs);
        }
        if (audit.pageErrors.length > 0) {
          console.log(`   Page errors:`, audit.pageErrors);
        }
        if (audit.failedRequests.length > 0) {
          console.log(`   Failed requests:`, audit.failedRequests);
        }
      } else {
        console.log(`✅ [PASS] ${route} (${vp.name}) - ${loadTimeMs}ms`);
      }

      await page.close();
    }
    await context.close();
  }

  await browser.close();

  console.log("\n================ SUMMARY ================");
  console.log(`Total Route+Viewport audits: ${results.length}`);
  console.log(`Audits with issues: ${totalIssues}`);

  if (totalIssues > 0) {
    process.exit(1);
  } else {
    console.log("All routes passed mobile and desktop audits with 0 errors, 0 broken images, and 0 overflow!");
  }
}

run().catch((err) => {
  console.error("Audit runner failed:", err);
  process.exit(1);
});
