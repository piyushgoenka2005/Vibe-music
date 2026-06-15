import "server-only";

import {
  getPaymentLogsSince,
  getRecentFailedPaymentLogs,
  listPaymentLogs,
} from "@/lib/server/paymentLogRepository";
import type { PaymentWebhookMetrics } from "@/types/payment";

import type { PaymentLogStatus } from "@/types/payment";

export async function getPaymentWebhookMetrics(): Promise<PaymentWebhookMetrics> {
  const [allRecent, failures] = await Promise.all([
    listPaymentLogs(500),
    getRecentFailedPaymentLogs(10),
  ]);

  const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const last24hLogs = await getPaymentLogsSince(since24h);

  const byStatus: Record<PaymentLogStatus, number> = {
    processed: 0,
    failed: 0,
    skipped: 0,
    received: 0,
    processing: 0,
  };

  const byEventType: Record<string, number> = {};

  for (const log of allRecent) {
    byStatus[log.status] = (byStatus[log.status] ?? 0) + 1;
    byEventType[log.eventType] = (byEventType[log.eventType] ?? 0) + 1;
  }

  const last24h = {
    total: last24hLogs.length,
    processed: last24hLogs.filter((l) => l.status === "processed").length,
    failed: last24hLogs.filter((l) => l.status === "failed").length,
  };

  return {
    totalEvents: allRecent.length,
    processed: byStatus.processed,
    failed: byStatus.failed,
    skipped: byStatus.skipped,
    received: byStatus.received,
    processing: byStatus.processing,
    byEventType,
    last24Hours: last24h,
    recentFailures: failures.map((log) => ({
      id: log.id,
      eventType: log.eventType,
      orderId: log.orderId,
      error: log.error,
      createdAt: log.createdAt,
    })),
  };
}
