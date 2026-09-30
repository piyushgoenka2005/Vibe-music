import "server-only";

import { isE2ETestMode } from "@/lib/server/e2eResetCapture";
import { isDemoPaymentsAllowed } from "@/lib/server/env";
import { isJsonCatalogFallbackAllowed } from "@/lib/server/prisma/catalogRepository";

function isUpstashConfigured(): boolean {
  return Boolean(
    process.env.UPSTASH_REDIS_REST_URL?.trim() && process.env.UPSTASH_REDIS_REST_TOKEN?.trim(),
  );
}

export interface ProductionSecurityAudit {
  demoPaymentsBlocked: boolean;
  e2eResetCaptureDisabled: boolean;
  jsonCatalogFallbackBlocked: boolean;
  distributedRateLimitConfigured: boolean;
  guestOrderBulkLinkDisabled: boolean;
  issues: string[];
}

/** Non-throwing audit for admin ops and CI sign-off. */
export function auditProductionSecurityControls(): ProductionSecurityAudit {
  const isProd = process.env.NODE_ENV === "production";
  const issues: string[] = [];

  const demoPaymentsBlocked = isProd
    ? process.env.ALLOW_DEMO_PAYMENTS?.trim() !== "true"
    : !isDemoPaymentsAllowed();
  if (isProd && !demoPaymentsBlocked) {
    issues.push("ALLOW_DEMO_PAYMENTS must not be enabled in production");
  }

  const e2eResetCaptureDisabled = !isE2ETestMode();
  if (isProd && !e2eResetCaptureDisabled) {
    issues.push("E2E_TEST_MODE must not be enabled in production");
  }

  const jsonCatalogFallbackBlocked = !isJsonCatalogFallbackAllowed() || !isProd;
  if (isProd && isJsonCatalogFallbackAllowed()) {
    issues.push("ALLOW_JSON_CATALOG_FALLBACK must not be enabled in production");
  }

  const distributedRateLimitConfigured = isUpstashConfigured();
  if (isProd && !distributedRateLimitConfigured) {
    issues.push(
      "UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN are required in production for distributed rate limiting",
    );
  }

  return {
    demoPaymentsBlocked,
    e2eResetCaptureDisabled,
    jsonCatalogFallbackBlocked,
    distributedRateLimitConfigured,
    guestOrderBulkLinkDisabled: true,
    issues,
  };
}

/** Fail fast at startup when production security controls are misconfigured. */
export function assertProductionSecurityControls(): void {
  if (process.env.NODE_ENV !== "production") return;
  const audit = auditProductionSecurityControls();
  if (audit.issues.length > 0) {
    throw new Error(`Production security misconfiguration: ${audit.issues.join("; ")}`);
  }
}
