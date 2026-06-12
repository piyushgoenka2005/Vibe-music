import { NextResponse } from "next/server";
import { requireAdmin, adminErrorResponse } from "@/lib/auth/require-admin";
import {
  getDashboardStats,
  getRevenueChartData,
  getRecentOrders,
  getRecentCustomers,
  getLowStockProducts,
  getTopProducts,
} from "@/lib/server/dashboardService";

export async function GET() {
  try {
    await requireAdmin("dashboard:read");

    const [stats, revenueChart, recentOrders, recentCustomers, lowStock, topProducts] =
      await Promise.all([
        getDashboardStats(),
        getRevenueChartData(30),
        getRecentOrders(10),
        getRecentCustomers(10),
        getLowStockProducts(10),
        getTopProducts(5),
      ]);

    return NextResponse.json({
      stats,
      revenueChart,
      recentOrders,
      recentCustomers,
      lowStock,
      topProducts,
    });
  } catch (error) {
    return adminErrorResponse(error);
  }
}
