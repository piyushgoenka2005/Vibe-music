#!/usr/bin/env npx tsx
/**
 * Verify ERROR_MONITORING_WEBHOOK_URL delivers alerts.
 *
 *   npm run ops:error-monitoring-ping
 */
import { pingErrorMonitoringWebhook } from "@/lib/server/errorMonitoring";

async function main(): Promise<void> {
  await pingErrorMonitoringWebhook();
  console.log("✅ Error monitoring webhook ping delivered");
}

main().catch((error) => {
  console.error("✗", error instanceof Error ? error.message : String(error));
  process.exit(1);
});
