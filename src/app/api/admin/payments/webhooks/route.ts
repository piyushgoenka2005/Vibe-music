import { NextResponse } from "next/server";
import { requireAdmin, adminErrorResponse } from "@/lib/auth/require-admin";
import { getPaymentWebhookMetrics } from "@/lib/server/paymentWebhookMetricsService";
import { listPaymentLogs } from "@/lib/server/paymentLogRepository";

export async function GET(request: Request) {
  try {
    await requireAdmin("analytics:read");

    const { searchParams } = new URL(request.url);
    const includeLogs = searchParams.get("logs") === "true";

    const metrics = await getPaymentWebhookMetrics();
    const logs = includeLogs ? await listPaymentLogs(25) : undefined;

    return NextResponse.json({ metrics, logs });
  } catch (error) {
    return adminErrorResponse(error);
  }
}
