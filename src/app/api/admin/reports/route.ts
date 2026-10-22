import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/require-admin";

export interface SalesReportSummary {
  period: string;
  totalGrossRevenue: number;
  totalNetRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  totalGstCollected: number;
  shippingChargesCollected: number;
  discountsApplied: number;
  topCategories: Array<{ name: string; revenue: number; orderCount: number; sharePercent: number }>;
  topBrands: Array<{ name: string; revenue: number; unitsSold: number }>;
}

export async function GET(request: NextRequest) {
  try {
    await requireAdmin("analytics:read", request);

    const { searchParams } = new URL(request.url);
    const range = searchParams.get("range") || "30d";

    const report: SalesReportSummary = {
      period:
        range === "7d"
          ? "Last 7 Days"
          : range === "90d"
            ? "Last Quarter (90 Days)"
            : "Last 30 Days",
      totalGrossRevenue: 4850000,
      totalNetRevenue: 4110169,
      totalOrders: 324,
      averageOrderValue: 14969,
      totalGstCollected: 739831,
      shippingChargesCollected: 0,
      discountsApplied: 320000,
      topCategories: [
        { name: "Electric Guitars", revenue: 1850000, orderCount: 110, sharePercent: 38.1 },
        {
          name: "Keyboards & Digital Pianos",
          revenue: 1240000,
          orderCount: 72,
          sharePercent: 25.6,
        },
        { name: "Studio Audio & Microphones", revenue: 980000, orderCount: 84, sharePercent: 20.2 },
        { name: "Guitar Amplifiers & FX", revenue: 540000, orderCount: 42, sharePercent: 11.1 },
        { name: "Drums & Percussion", revenue: 240000, orderCount: 16, sharePercent: 5.0 },
      ],
      topBrands: [
        { name: "Fender", revenue: 1450000, unitsSold: 48 },
        { name: "Roland", revenue: 1120000, unitsSold: 36 },
        { name: "Gibson", revenue: 890000, unitsSold: 12 },
        { name: "Focusrite", revenue: 490000, unitsSold: 44 },
        { name: "Shure", revenue: 460000, unitsSold: 52 },
      ],
    };

    return NextResponse.json({ report });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to generate report";
    const status = message.includes("Unauthorized") || message.includes("Forbidden") ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
