import { NextResponse } from "next/server";
import { requireAdmin, adminErrorResponse } from "@/lib/auth/require-admin";
import {
  getDashboardStats,
  getLowStockProducts,
  getOutOfStockProductList,
  getRevenueChartData,
  getRecentOrders,
  getRecentCustomers,
  getTopProducts,
} from "@/lib/server/dashboardService";

export async function GET() {
  try {
    await requireAdmin("dashboard:read");

    const [stats, revenueChart, recentOrders, recentCustomers, lowStock, outOfStock, topProducts] =
      await Promise.all([
        getDashboardStats(),
        getRevenueChartData(30),
        getRecentOrders(10),
        getRecentCustomers(10),
        getLowStockProducts(10),
        getOutOfStockProductList(10),
        getTopProducts(5),
      ]);

    return NextResponse.json({
      stats,
      revenueChart,
      recentOrders,
      recentCustomers,
      lowStock,
      outOfStock,
      topProducts,
    });
  } catch (error) {
    return adminErrorResponse(error);
  }
}
