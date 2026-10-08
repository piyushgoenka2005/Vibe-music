/**
 * One-shot: move lib/server modules into domain folders and write legacy shims.
 * Run: node scripts/ops/apply-codebase-structure.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

const root = process.cwd();
const serverRoot = path.join(root, "src", "lib", "server");

const DOMAIN_FILES = {
  payments: [
    "razorpayWebhookService.ts",
    "razorpayWebhookService.test.ts",
    "razorpayRefundService.ts",
    "paymentAmountVerification.ts",
    "paymentAmountVerification.test.ts",
    "paymentDiagnostics.ts",
    "paymentLogRepository.ts",
    "paymentLogRepository.integration.test.ts",
    "paymentWebhookMetricsService.ts",
  ],
  homepage: [
    "homepageRepository.ts",
    "homepageService.ts",
    "homepageStoryService.ts",
    "homepageStoryService.test.ts",
    "homepageBannerSlides.ts",
    "homepageSnapshotCache.ts",
    "footerTrendingService.ts",
    "socialRailService.ts",
    "socialRailSnapshotCache.ts",
    "dealsPageLoader.ts",
    "findYourProductTracks.ts",
    "gearStoryService.ts",
    "gearStoryService.test.ts",
  ],
  rentals: [
    "rentalBookingService.ts",
    "rentalBookingService.test.ts",
    "rentalRepository.ts",
    "rentalEmailService.ts",
    "rentalNotificationService.ts",
  ],
  giveaway: [
    "giveawayEntryService.ts",
    "giveawayRepository.ts",
    "giveawayEmailService.ts",
    "giveawayNotificationService.ts",
  ],
  admin: [
    "adminService.ts",
    "adminProductService.ts",
    "adminFastLogin.ts",
    "adminInviteEmailService.ts",
    "adminLoginGate.ts",
    "adminNotificationEmailService.ts",
    "adminTotpService.ts",
    "dashboardService.ts",
    "auditLog.ts",
  ],
  shipping: [
    "shippingQuoteService.ts",
    "shippingQuoteService.test.ts",
    "shippingZoneRepository.ts",
    "shipmentService.ts",
    "shipmentRepository.ts",
    "shipmentEmailService.ts",
  ],
  reviews: [
    "reviewService.ts",
    "reviewRepository.ts",
    "reviewEligibilityService.ts",
    "reviewStatsService.ts",
    "reviewVoteService.ts",
    "productQuestionRepository.ts",
  ],
  inventory: [
    "inventoryService.ts",
    "inventoryRepository.ts",
    "inventoryRepository.reserve.test.ts",
    "stockAlertRepository.ts",
    "restockNotificationService.ts",
    "restockNotificationService.test.ts",
    "restockEmailService.ts",
  ],
  users: [
    "userService.ts",
    "addressService.ts",
    "addressRepository.ts",
    "wishlistShareService.ts",
    "wishlistShareRepository.ts",
    "newsletterRepository.ts",
    "newsletterEmailService.ts",
    "passwordResetEmailService.ts",
    "customerUpdateEmailService.ts",
  ],
  content: [
    "blogRepository.ts",
    "blogService.ts",
    "contentPageRepository.ts",
    "bannerRepository.ts",
    "bannerService.ts",
    "contactRepository.ts",
  ],
  taxonomy: ["taxonomyRepository.ts", "taxonomyRepository.test.ts", "taxonomyApiErrors.ts"],
  search: ["searchResultsService.ts", "searchAnalyticsService.ts", "searchAnalyticsRepository.ts"],
  integrations: [
    "integrationChannels.ts",
    "integrationChannels.test.ts",
    "integrationConfig.ts",
    "integrationConfig.test.ts",
    "googlePlaces.ts",
    "googlePlaces.test.ts",
    "nominatimAddress.ts",
  ],
  platform: [
    "logger.ts",
    "redisCache.ts",
    "redisCache.test.ts",
    "jobQueue.ts",
    "jobQueue.test.ts",
    "publicApiError.ts",
    "postgresHealth.ts",
    "gracefulShutdown.ts",
    "gracefulShutdown.test.ts",
    "productionSecurityGuards.ts",
    "productionSecurityGuards.test.ts",
    "metricsAuth.ts",
    "metricsAuth.test.ts",
    "tracing.ts",
    "env.ts",
    "errorMonitoring.ts",
    "errorMonitoring.test.ts",
    "e2eResetCapture.ts",
    "e2eResetCapture.test.ts",
    "withTimeout.ts",
    "raceWithTimeout.ts",
    "requestMetrics.ts",
    "cdnStorage.ts",
    "cdnStorage.test.ts",
    "cdnImageOptimize.ts",
    "pushService.ts",
    "pushService.test.ts",
  ],
  settings: ["settingsService.ts"],
  support: ["supportTicketRepository.ts", "returnRequestRepository.ts"],
  roles: ["rolePermissionsRepository.ts", "rolePermissionsService.ts"],
};

const CATALOG_EXTRA = [
  "categoryRepository.ts",
  "categoryResolver.ts",
  "categoryPageLoader.ts",
  "categoriesPageLoader.ts",
  "categoryBentoCatalog.ts",
  "categoryBentoCatalog.test.ts",
  "brandsPageLoader.ts",
  "brandRepository.ts",
  "productDetailLoader.ts",
  "relatedProductsService.ts",
  "compareProductLoader.ts",
  "compareRepository.ts",
  "compareService.ts",
  "bundleService.ts",
  "variantService.ts",
  "storeCatalogRepository.ts",
  "catalogSnapshotCache.ts",
  "cartPricingService.ts",
  "bulkImportImageResolver.ts",
  "bulkImportImageResolver.test.ts",
];

DOMAIN_FILES.catalog = CATALOG_EXTRA;

const SHIM_SKIP = new Set([
  "catalogRepository.ts",
  "productRepository.ts",
  "couponService.ts",
  "orderService.ts",
  "orderValidation.ts",
  "orderPaymentService.ts",
  "checkoutErrors.ts",
  "orderRepository.ts",
  "orderCancellationService.ts",
  "orderVerificationService.ts",
  "orderTrackingToken.ts",
  "orderAccess.ts",
  "orderNotificationService.ts",
  "orderIdGenerator.ts",
  "adminOrderService.ts",
]);

function isShim(content) {
  return content.includes("@deprecated") && content.includes("shim for legacy paths");
}

function writeShim(fileName, domain) {
  if (fileName.endsWith(".test.ts") || fileName.includes(".integration.test.ts")) return;
  if (SHIM_SKIP.has(fileName)) return;
  const base = fileName.replace(/\.test\.ts$/, "").replace(/\.ts$/, "");
  const shimPath = path.join(serverRoot, fileName);
  const target = `@/lib/server/${domain}/${base}`;
  const shim = `/** @deprecated Import from \`${target}\` — shim for legacy paths. */\nexport * from "${target}";\n`;
  fs.writeFileSync(shimPath, shim, "utf8");
}

let moved = 0;
let skipped = 0;

for (const [domain, files] of Object.entries(DOMAIN_FILES)) {
  const domainDir = path.join(serverRoot, domain);
  fs.mkdirSync(domainDir, { recursive: true });

  for (const fileName of files) {
    const src = path.join(serverRoot, fileName);
    const dest = path.join(domainDir, fileName);
    const impl = path.join(domainDir, fileName);

    if (!fs.existsSync(src)) {
      if (fs.existsSync(impl)) {
        skipped += 1;
        continue;
      }
      console.warn(`skip missing: ${fileName}`);
      skipped += 1;
      continue;
    }

    const content = fs.readFileSync(src, "utf8");
    if (isShim(content)) {
      skipped += 1;
      continue;
    }

    if (fs.existsSync(dest)) {
      fs.unlinkSync(src);
      writeShim(fileName, domain);
      moved += 1;
      continue;
    }

    execSync(`git mv "${src.replace(/\\/g, "/")}" "${dest.replace(/\\/g, "/")}"`, {
      stdio: "inherit",
    });
    writeShim(fileName, domain);
    moved += 1;
  }
}

// adminOrderService.test.ts belongs in orders/
const adminOrderTest = path.join(serverRoot, "adminOrderService.test.ts");
const ordersTestDest = path.join(serverRoot, "orders", "adminOrderService.test.ts");
if (fs.existsSync(adminOrderTest) && !fs.existsSync(ordersTestDest)) {
  execSync(`git mv "${adminOrderTest.replace(/\\/g, "/")}" "${ordersTestDest.replace(/\\/g, "/")}"`, {
    stdio: "inherit",
  });
  moved += 1;
}

// notificationRepository at server root -> notifications/
const notifRepo = path.join(serverRoot, "notificationRepository.ts");
const notifRepoDest = path.join(serverRoot, "notifications", "notificationRepository.ts");
if (fs.existsSync(notifRepo)) {
  const content = fs.readFileSync(notifRepo, "utf8");
  if (!isShim(content)) {
    if (!fs.existsSync(notifRepoDest)) {
      execSync(`git mv "${notifRepo.replace(/\\/g, "/")}" "${notifRepoDest.replace(/\\/g, "/")}"`, {
        stdio: "inherit",
      });
    }
    writeShim("notificationRepository.ts", "notifications");
    moved += 1;
  }
}
const notifTest = path.join(serverRoot, "notificationRepository.test.ts");
const notifTestDest = path.join(serverRoot, "notifications", "notificationRepository.test.ts");
if (fs.existsSync(notifTest) && !fs.existsSync(notifTestDest)) {
  execSync(`git mv "${notifTest.replace(/\\/g, "/")}" "${notifTestDest.replace(/\\/g, "/")}"`, {
    stdio: "inherit",
  });
  moved += 1;
}

console.log(`\nDone. moved=${moved} skipped=${skipped}`);
