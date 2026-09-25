#!/usr/bin/env npx tsx
/**
 * Regenerate docs/audit/vibemusic_audit.json from L-register + Playwright suite.
 * Usage: npm run audit:generate-catalog
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const OUT = path.join(process.cwd(), "docs", "audit", "vibemusic_audit.json");

const L_REGISTER: Array<{
  id: string;
  severity: string;
  category: string;
  title: string;
  repoStatus: string;
  verifyCommand: string;
  testRefs: string[];
}> = [
  {
    id: "L-01",
    severity: "medium",
    category: "ux",
    title: "Marquee SSR duplication / screen reader noise",
    repoStatus: "fixed",
    verifyCommand: "npm test -- src/components/common/Marquee.test.tsx",
    testRefs: ["Marquee.test.tsx"],
  },
  {
    id: "L-02",
    severity: "medium",
    category: "ux",
    title: "Cart badge accessible label",
    repoStatus: "verified",
    verifyCommand: "npx playwright test e2e/accessibility.spec.ts -g cart",
    testRefs: ["e2e/accessibility.spec.ts"],
  },
  {
    id: "L-03",
    severity: "medium",
    category: "ux",
    title: "Product card title scannability",
    repoStatus: "verified",
    verifyCommand: "npm test -- src/lib/product/formatProductCardTitle.test.ts",
    testRefs: ["formatProductCardTitle.test.ts"],
  },
  {
    id: "L-04",
    severity: "medium",
    category: "ux",
    title: "Optional live chat (Crisp)",
    repoStatus: "fixed",
    verifyCommand: "grep NEXT_PUBLIC_CRISP_WEBSITE_ID .env.production.example",
    testRefs: ["SupportChatLoader.tsx"],
  },
  {
    id: "L-05",
    severity: "low",
    category: "ux",
    title: "Grand Piano nav IA",
    repoStatus: "fixed",
    verifyCommand: "manual: homepage nav visual",
    testRefs: [],
  },
  {
    id: "L-06",
    severity: "low",
    category: "ux",
    title: "Deals countdown urgency",
    repoStatus: "fixed",
    verifyCommand: "npm test -- src/lib/deals/dealsCountdown.test.ts",
    testRefs: ["dealsCountdown.test.ts"],
  },
  {
    id: "L-07",
    severity: "high",
    category: "ux",
    title: "Search autosuggest",
    repoStatus: "fixed",
    verifyCommand: "npx playwright test e2e -g 'search overlay'",
    testRefs: ["e2e-audit-catalog.json#L-07-search"],
  },
  {
    id: "L-08",
    severity: "medium",
    category: "seo",
    title: "Product slug deduplication",
    repoStatus: "fixed",
    verifyCommand: "npm test -- src/lib/categorySlug.test.ts",
    testRefs: ["buildProductSlug"],
  },
  {
    id: "L-09",
    severity: "medium",
    category: "seo",
    title: "robots.txt + sitemap",
    repoStatus: "verified",
    verifyCommand: "curl -s $VERIFY_BASE_URL/robots.txt && curl -s $VERIFY_BASE_URL/sitemap.xml",
    testRefs: ["src/app/robots.ts", "src/app/sitemap.ts"],
  },
  {
    id: "L-10",
    severity: "medium",
    category: "seo",
    title: "Product JSON-LD",
    repoStatus: "verified",
    verifyCommand: "npm test -- src/lib/seo/productJsonLd.test.ts",
    testRefs: ["productJsonLd.test.ts"],
  },
  {
    id: "L-11",
    severity: "high",
    category: "performance",
    title: "Homepage section payload cap",
    repoStatus: "verified",
    verifyCommand: "npm test -- src/lib/homepage/homepageLimits.test.ts",
    testRefs: ["homepageLimits.test.ts", "homepageService.ts"],
  },
  {
    id: "L-12",
    severity: "medium",
    category: "performance",
    title: "Deal card responsive images",
    repoStatus: "fixed",
    verifyCommand: "npm test -- src/components/homepage/DealProductCard.test.tsx",
    testRefs: ["DealProductCard.test.tsx"],
  },
  {
    id: "L-13",
    severity: "low",
    category: "performance",
    title: "Preconnect resource hints",
    repoStatus: "verified",
    verifyCommand: "grep preconnect src/app/layout.tsx",
    testRefs: ["layout.tsx"],
  },
  {
    id: "L-14",
    severity: "high",
    category: "performance",
    title: "CWV / Lighthouse gates",
    repoStatus: "verified",
    verifyCommand: "npm run check:cwv",
    testRefs: [".github/workflows/lighthouse.yml"],
  },
  {
    id: "L-15",
    severity: "critical",
    category: "security",
    title: "Server-side checkout pricing",
    repoStatus: "verified",
    verifyCommand: "npm test -- src/app/api/payment/create-order/route.test.ts",
    testRefs: ["e2e-audit-catalog.json#L-15-tamper"],
  },
  {
    id: "L-16",
    severity: "high",
    category: "security",
    title: "Security headers (CSP/HSTS)",
    repoStatus: "verified",
    verifyCommand: "npm run verify:prod-signoff",
    testRefs: ["headers.test.ts", "e2e/audit-fixes.spec.ts"],
  },
  {
    id: "L-17",
    severity: "high",
    category: "security",
    title: "Rate limits + CSRF",
    repoStatus: "verified",
    verifyCommand: "npm test -- src/proxy.test.ts",
    testRefs: ["proxy.test.ts"],
  },
  {
    id: "L-18",
    severity: "medium",
    category: "security",
    title: "Auth oracle safety",
    repoStatus: "verified",
    verifyCommand: "npx playwright test e2e/security-hardening.spec.ts",
    testRefs: ["security-hardening.spec.ts"],
  },
  {
    id: "L-19",
    severity: "critical",
    category: "security",
    title: "IDOR on orders/wishlist/addresses",
    repoStatus: "verified",
    verifyCommand: "npx playwright test e2e/idor.spec.ts e2e/idor.authenticated.spec.ts",
    testRefs: ["idor.spec.ts", "idor.authenticated.spec.ts"],
  },
  {
    id: "L-20",
    severity: "high",
    category: "security",
    title: "Dependency audit gate",
    repoStatus: "fixed",
    verifyCommand: "npm run audit:deps",
    testRefs: ["scripts/ops/audit-deps.mjs"],
  },
  {
    id: "L-21",
    severity: "high",
    category: "security",
    title: "Razorpay webhook HMAC",
    repoStatus: "verified",
    verifyCommand: "npm test -- src/app/api/payment/webhook/razorpay/route.test.ts",
    testRefs: ["webhook/razorpay/route.test.ts"],
  },
  {
    id: "L-22",
    severity: "critical",
    category: "infra",
    title: "CDN/WAF edge (Cloudflare)",
    repoStatus: "automated",
    verifyCommand: "VERIFY_BASE_URL=https://vibemusic.in npm run check:edge",
    testRefs: ["deploy/complete-audit-go-live.sh"],
  },
  {
    id: "L-23",
    severity: "high",
    category: "infra",
    title: "Origin firewall Cloudflare-only",
    repoStatus: "automated",
    verifyCommand: "sudo CLOUDFLARE_ONLY=1 bash deploy/complete-audit-go-live.sh",
    testRefs: ["deploy/cloudflare-ufw.sh"],
  },
  {
    id: "L-24",
    severity: "high",
    category: "reliability",
    title: "Inventory FOR UPDATE locks",
    repoStatus: "verified",
    verifyCommand: "npm test -- src/lib/server/inventoryRepository.reserve.test.ts",
    testRefs: ["inventoryRepository.reserve.test.ts"],
  },
  {
    id: "L-25",
    severity: "medium",
    category: "reliability",
    title: "Load test scripts (k6)",
    repoStatus: "fixed",
    verifyCommand: "npm run load:k6",
    testRefs: ["scripts/k6/smoke.js"],
  },
  {
    id: "L-26",
    severity: "critical",
    category: "testing",
    title: "Checkout E2E CI merge gate",
    repoStatus: "verified",
    verifyCommand: "npm run verify:e2e-catalog",
    testRefs: ["docs/ops/e2e-audit-catalog.json"],
  },
  {
    id: "L-27",
    severity: "medium",
    category: "reliability",
    title: "Homepage error boundaries",
    repoStatus: "fixed",
    verifyCommand: "grep HomeSectionErrorBoundary src/components/home/HomePage.tsx",
    testRefs: ["HomeSectionErrorBoundary.tsx"],
  },
  {
    id: "L-28",
    severity: "medium",
    category: "ops",
    title: "Disaster recovery runbook",
    repoStatus: "fixed",
    verifyCommand: "test -f docs/ops/DISASTER_RECOVERY.md",
    testRefs: ["DISASTER_RECOVERY.md"],
  },
  {
    id: "L-29",
    severity: "medium",
    category: "compliance",
    title: "Analytics consent gates GA4",
    repoStatus: "verified",
    verifyCommand: "npm test -- src/lib/analytics/gtag.test.ts",
    testRefs: ["gtag.test.ts"],
  },
  {
    id: "L-30",
    severity: "medium",
    category: "compliance",
    title: "Legal entity + GSTIN in footer",
    repoStatus: "verified",
    verifyCommand:
      "REQUIRE_COMPLIANCE=true VERIFY_BASE_URL=https://vibemusic.in npm run verify:prod-signoff",
    testRefs: ["resolvePublicLegal.ts", "deploy/apply-compliance.sh"],
  },
];

function listPlaywright(): string[] {
  const result = spawnSync("npx", ["playwright", "test", "--list"], {
    encoding: "utf8",
    shell: process.platform === "win32",
  });
  if (result.status !== 0) return [];
  return result.stdout
    .split(/\r?\n/)
    .filter((line) => line.includes("›"))
    .map((line) => line.trim());
}

const e2eTests = listPlaywright();
const mergeGate = JSON.parse(
  fs.readFileSync(path.join(process.cwd(), "docs", "ops", "e2e-audit-catalog.json"), "utf8"),
) as { mergeGate: Array<{ id: string; finding: string; pattern: string }> };

const payload = {
  version: 1,
  generatedAt: new Date().toISOString(),
  product: "vibemusic.in",
  loopholesRegister: L_REGISTER,
  mergeGateE2E: mergeGate.mergeGate,
  playwrightSuite: {
    totalListed: e2eTests.length,
    samples: e2eTests.slice(0, 30),
  },
  productionGates: [
    "npm run verify:prod-signoff",
    "npm run check:edge",
    "npm run monitor:checkout",
    "npm run verify:readiness",
  ],
};

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, `${JSON.stringify(payload, null, 2)}\n`);
console.log(`Wrote ${OUT} (${L_REGISTER.length} findings, ${e2eTests.length} E2E lines)`);
