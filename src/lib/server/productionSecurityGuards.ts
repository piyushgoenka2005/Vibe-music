import "server-only";

import { isE2ETestMode } from "@/lib/server/e2eResetCapture";
import { isDemoPaymentsAllowed } from "@/lib/server/env";
import { isJsonCatalogFallbackAllowed } from "@/lib/server/prisma/catalogRepository";

export interface ProductionSecurityAudit {
  demoPaymentsBlocked: boolean;
  e2eResetCaptureDisabled: boolean;
  jsonCatalogFallbackBlocked: boolean;
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

  return {
    demoPaymentsBlocked,
    e2eResetCaptureDisabled,
    jsonCatalogFallbackBlocked,
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
