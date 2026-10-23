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
import { getCached, invalidateCache } from "@/lib/server/platform/redisCache";

export async function GET(request: Request) {
  try {
    await requireAdmin("dashboard:read");

    const url = new URL(request.url);
    const forceRefresh = url.searchParams.get("refresh") === "true";

    const fetchDashboardData = async () => {
      // Every widget below is served by Postgres aggregates / bounded queries —
      // the dashboard no longer loads the whole orders table per request.
      const [
        stats,
        revenueChart,
        recentOrders,
        recentCustomers,
        lowStock,
        outOfStock,
        topProducts,
      ] = await Promise.all([
        getDashboardStats(),
        getRevenueChartData(30),
        getRecentOrders(10),
        getRecentCustomers(10),
        getLowStockProducts(10),
        getOutOfStockProductList(10),
        getTopProducts(5),
      ]);

      return {
        stats,
        revenueChart,
        recentOrders,
        recentCustomers,
        lowStock,
        outOfStock,
        topProducts,
      };
    };

    if (forceRefresh) {
      await invalidateCache("admin:dashboard:overview");
      const data = await fetchDashboardData();
      return NextResponse.json(data);
    }

    const data = await getCached("admin:dashboard:overview", fetchDashboardData, 15);
    return NextResponse.json(data);
  } catch (error) {
    return adminErrorResponse(error);
  }
}
