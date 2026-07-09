import { NextResponse } from "next/server";
import { requireAdmin, adminErrorResponse } from "@/lib/auth/require-admin";
import { getAnalyticsReport } from "@/lib/server/settingsService";

function escapeCsv(value: string | number): string {
  const text = String(value);
  if (/[",\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

export async function GET(request: Request) {
  try {
    await requireAdmin("analytics:read");
    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") ?? "30d";
    const report = await getAnalyticsReport(period);

    const lines: string[] = [
      "Section,Metric,Value",
      `Summary,Period,${escapeCsv(report.period)}`,
      `Summary,Total Revenue,${report.totalRevenue}`,
      `Summary,Total Orders,${report.totalOrders}`,
      `Summary,Average Order Value,${Math.round(report.averageOrderValue)}`,
    ];

    for (const [status, count] of Object.entries(report.ordersByStatus)) {
      lines.push(`Orders by Status,${escapeCsv(status)},${count}`);
    }

    for (const row of report.topProducts) {
      lines.push(
        `Top Products,${escapeCsv(row.name)},${row.units} units / ${row.revenue} revenue`
      );
    }

    for (const row of report.revenueByMonth) {
      lines.push(
        `Revenue Trend,${escapeCsv(row.date)},${row.revenue} revenue / ${row.orders} orders`
      );
    }

    const csv = lines.join("\n");
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="vibe-analytics-${period}.csv"`,
      },
    });
  } catch (error) {
    return adminErrorResponse(error);
  }
}
