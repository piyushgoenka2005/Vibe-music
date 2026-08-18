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
import { listAllOrders } from "@/lib/server/prisma/orderRepository";

export async function GET() {
  try {
    await requireAdmin("dashboard:read");

    // Every dashboard widget previously issued its own full order-table read.
    // Load it once per request and share that consistent snapshot across the
    // aggregates, chart, recent-order list, and top-product calculation.
    const orders = await listAllOrders();

    const [stats, revenueChart, recentOrders, recentCustomers, lowStock, outOfStock, topProducts] =
      await Promise.all([
        getDashboardStats(orders),
        getRevenueChartData(30, orders),
        getRecentOrders(10, orders),
        getRecentCustomers(10),
        getLowStockProducts(10),
        getOutOfStockProductList(10),
        getTopProducts(5, orders),
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
