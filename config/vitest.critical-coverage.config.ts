import { defineConfig, mergeConfig } from "vitest/config";
import base from "./vitest.config";

/**
 * Coverage gate for money-handling + security-critical modules.
 */
export default mergeConfig(
  base,
  defineConfig({
    test: {
      coverage: {
        include: [
          "src/lib/gst/**",
          "src/lib/security/circuit-breaker.ts",
          "src/lib/security/mutation-origin.ts",
          "src/lib/security/rate-limit-core.ts",
          "src/lib/security/backpressure.ts",
          "src/lib/server/payments/razorpayWebhookService.ts",
          "src/lib/server/orders/orderPaymentService.ts",
          "src/lib/server/jobQueue.ts",
          "src/lib/server/productionSecurityGuards.ts",
          "src/lib/server/metricsAuth.ts",
          "src/lib/cart/**",
          "src/lib/api/route-utils.ts",
          "src/lib/api/route-observation.ts",
        ],
        thresholds: {
          statements: 60,
          branches: 55,
          functions: 60,
          lines: 60,
        },
      },
    },
  }),
);
