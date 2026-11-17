import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/require-admin";
import { prisma } from "@/lib/db/prisma";

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
  salesByCategory?: Array<{ category: string; revenue: number; orders: number }>;
  salesTrend?: Array<{ date: string; revenue: number; orders: number }>;
}

export async function GET(request: NextRequest) {
  try {
    await requireAdmin("analytics:read", request);

    const { searchParams } = new URL(request.url);
    const range = searchParams.get("range") || "30d";

    const now = new Date();
    const since = new Date(now);

    let period = "Last 30 Days";
    if (range === "7d") {
      since.setDate(now.getDate() - 7);
      period = "Last 7 Days";
    } else if (range === "90d") {
      since.setDate(now.getDate() - 90);
      period = "Last Quarter (90 Days)";
    } else if (range === "1y") {
      since.setFullYear(now.getFullYear() - 1);
      period = "Last 1 Year (365 Days)";
    } else {
      since.setDate(now.getDate() - 30);
      period = "Last 30 Days";
    }

    const sinceIso = since.toISOString();

    // Query real live orders from database
    const orders = await prisma.order.findMany({
      where: {
        createdAt: { gte: sinceIso },
        status: { notIn: ["cancelled"] },
      },
      select: {
        id: true,
        total: true,
        subtotal: true,
        totalGst: true,
        shippingCharge: true,
        couponDiscount: true,
        status: true,
        paymentStatus: true,
        items: true,
        createdAt: true,
      },
      orderBy: { createdAt: "asc" },
    });

    if (orders.length === 0) {
      const emptyReport: SalesReportSummary = {
        period,
        totalGrossRevenue: 0,
        totalNetRevenue: 0,
        totalOrders: 0,
        averageOrderValue: 0,
        totalGstCollected: 0,
        shippingChargesCollected: 0,
        discountsApplied: 0,
        topCategories: [],
        topBrands: [],
        salesByCategory: [],
        salesTrend: [],
      };

      return NextResponse.json({
        report: emptyReport,
        totalGrossRevenue: 0,
        totalNetRevenue: 0,
        totalOrders: 0,
        averageOrderValue: 0,
        salesByCategory: [],
        salesTrend: [],
      });
    }

    let totalGrossRevenue = 0;
    let totalNetRevenue = 0;
    let totalGstCollected = 0;
    let shippingChargesCollected = 0;
    let discountsApplied = 0;

    const productIdsToFetch = new Set<string>();

    for (const order of orders) {
      totalGrossRevenue += order.total || 0;
      totalNetRevenue += order.subtotal || 0;
      totalGstCollected += order.totalGst || 0;
      shippingChargesCollected += order.shippingCharge || 0;
      discountsApplied += order.couponDiscount || 0;

      const rawItems = Array.isArray(order.items) ? order.items : [];
      for (const item of rawItems) {
        if (
          item &&
          typeof item === "object" &&
          "productId" in item &&
          typeof (item as { productId: unknown }).productId === "string"
        ) {
          productIdsToFetch.add((item as { productId: string }).productId);
        }
      }
    }

    const productMap = new Map<string, { category: string; brand: string }>();
    if (productIdsToFetch.size > 0) {
      const products = await prisma.product.findMany({
        where: { id: { in: Array.from(productIdsToFetch) } },
        select: { id: true, category: true, brand: true },
      });
      for (const p of products) {
        productMap.set(p.id, {
          category: p.category || "General",
          brand: p.brand || "Other",
        });
      }
    }

    const categoryMap = new Map<string, { revenue: number; orderIds: Set<string> }>();
    const brandMap = new Map<string, { revenue: number; unitsSold: number }>();
    const trendMap = new Map<string, { revenue: number; orders: number }>();

    for (const order of orders) {
      // Trend grouping by day (or month if 1y)
      const dateKey = range === "1y" ? order.createdAt.slice(0, 7) : order.createdAt.slice(0, 10);
      const trend = trendMap.get(dateKey) ?? { revenue: 0, orders: 0 };
      trend.revenue += order.total || 0;
      trend.orders += 1;
      trendMap.set(dateKey, trend);

      const rawItems = Array.isArray(order.items) ? order.items : [];
      for (const rawItem of rawItems) {
        if (!rawItem || typeof rawItem !== "object") continue;
        const item = rawItem as Record<string, unknown>;
        const pId = typeof item.productId === "string" ? item.productId : "";
        const pInfo = productMap.get(pId);

        const category =
          pInfo?.category || (typeof item.category === "string" ? item.category : "General");
        const brand = pInfo?.brand || (typeof item.brand === "string" ? item.brand : "Other");
        const qty = Number(item.quantity) || 1;
        const price = Number(item.price) || 0;
        const lineRev = price * qty;

        // Category breakdown
        const catEntry = categoryMap.get(category) ?? { revenue: 0, orderIds: new Set<string>() };
        catEntry.revenue += lineRev;
        catEntry.orderIds.add(order.id);
        categoryMap.set(category, catEntry);

        // Brand breakdown
        const brandEntry = brandMap.get(brand) ?? { revenue: 0, unitsSold: 0 };
        brandEntry.revenue += lineRev;
        brandEntry.unitsSold += qty;
        brandMap.set(brand, brandEntry);
      }
    }

    const totalItemRevenue = Array.from(categoryMap.values()).reduce(
      (sum, c) => sum + c.revenue,
      0,
    );

    const topCategories = Array.from(categoryMap.entries())
      .map(([name, data]) => ({
        name,
        revenue: Math.round(data.revenue),
        orderCount: data.orderIds.size,
        sharePercent:
          totalItemRevenue > 0 ? Number(((data.revenue / totalItemRevenue) * 100).toFixed(1)) : 0,
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    const salesByCategory = topCategories.map((c) => ({
      category: c.name,
      revenue: c.revenue,
      orders: c.orderCount,
    }));

    const topBrands = Array.from(brandMap.entries())
      .map(([name, data]) => ({
        name,
        revenue: Math.round(data.revenue),
        unitsSold: data.unitsSold,
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    const salesTrend = Array.from(trendMap.entries())
      .map(([date, data]) => ({
        date,
        revenue: Math.round(data.revenue),
        orders: data.orders,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    const totalOrders = orders.length;
    const averageOrderValue = totalOrders > 0 ? Math.round(totalGrossRevenue / totalOrders) : 0;

    const report: SalesReportSummary = {
      period,
      totalGrossRevenue: Math.round(totalGrossRevenue),
      totalNetRevenue: Math.round(totalNetRevenue),
      totalOrders,
      averageOrderValue,
      totalGstCollected: Math.round(totalGstCollected),
      shippingChargesCollected: Math.round(shippingChargesCollected),
      discountsApplied: Math.round(discountsApplied),
      topCategories,
      topBrands,
      salesByCategory,
      salesTrend,
    };

    return NextResponse.json({
      report,
      totalGrossRevenue: report.totalGrossRevenue,
      totalNetRevenue: report.totalNetRevenue,
      totalOrders: report.totalOrders,
      averageOrderValue: report.averageOrderValue,
      salesByCategory,
      salesTrend,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to generate report";
    const status = message.includes("Unauthorized") || message.includes("Forbidden") ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
