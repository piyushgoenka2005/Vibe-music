import {
  getInventoryStats,
  getLowStockProducts as getInventoryLowStock,
  getOutOfStockProducts,
} from "@/lib/server/inventoryService";
import * as pgOrder from "@/lib/server/prisma/orderRepository";
import * as pgUsers from "@/lib/server/prisma/usersRepository";
import { countActiveProducts } from "@/lib/server/prisma/catalogRepository";
import type { DashboardStats, RevenueDataPoint } from "@/types/admin";
import type { Order } from "@/types/order";

function isoDaysAgo(days: number, startOfDay = false): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  if (startOfDay) d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

/**
 * All money/count tiles are computed by Postgres aggregates — loading every
 * order into Node memory just to sum fields is O(table) per dashboard view.
 */
export async function getDashboardStats(): Promise<DashboardStats> {
  const thirtyDaysAgo = isoDaysAgo(30);
  const sixtyDaysAgo = isoDaysAgo(60);

  const [
    totalRevenue,
    recentRevenue,
    priorRevenue,
    recentOrderCount,
    priorOrderCount,
    statusCounts,
    totalCustomers,
    totalProducts,
    inventoryStats,
  ] = await Promise.all([
    pgOrder.sumPaidRevenue(),
    pgOrder.sumPaidRevenue({ from: thirtyDaysAgo }),
    pgOrder.sumPaidRevenue({ from: sixtyDaysAgo, to: thirtyDaysAgo }),
    pgOrder.countOrdersBetween({ from: thirtyDaysAgo }),
    pgOrder.countOrdersBetween({ from: sixtyDaysAgo, to: thirtyDaysAgo }),
    pgOrder.countOrdersGroupedByStatus(),
    pgUsers.countUsers(),
    countActiveProducts(),
    getInventoryStats(),
  ]);

  const revenueChangePercent =
    priorRevenue > 0
      ? Math.round(((recentRevenue - priorRevenue) / priorRevenue) * 100)
      : recentRevenue > 0
        ? 100
        : 0;

  const ordersChangePercent =
    priorOrderCount > 0
      ? Math.round(((recentOrderCount - priorOrderCount) / priorOrderCount) * 100)
      : recentOrderCount > 0
        ? 100
        : 0;

  return {
    totalRevenue,
    totalOrders: Object.values(statusCounts).reduce((sum, n) => sum + n, 0),
    totalCustomers,
    totalProducts,
    pendingOrders: statusCounts["pending"] ?? 0,
    processingOrders: statusCounts["processing"] ?? 0,
    completedOrders:
      (statusCounts["delivered"] ?? 0) + (statusCounts["shipped"] ?? 0),
    cancelledOrders: statusCounts["cancelled"] ?? 0,
    lowStockProducts: inventoryStats.lowStock,
    outOfStockProducts: inventoryStats.outOfStock,
    revenueChangePercent,
    ordersChangePercent,
  };
}

export async function getRevenueChartData(
  days = 30
): Promise<RevenueDataPoint[]> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days + 1);
  startDate.setHours(0, 0, 0, 0);

  const buckets = await pgOrder.getDailyPaidRevenueBuckets(
    startDate.toISOString()
  );

  const byDate = new Map<string, RevenueDataPoint>();
  for (let i = 0; i < days; i++) {
    const d = new Date(startDate);
    d.setDate(d.getDate() + i);
    const key = d.toISOString().slice(0, 10);
    byDate.set(key, { date: key, revenue: 0, orders: 0 });
  }
  for (const bucket of buckets) {
    const target = byDate.get(bucket.date);
    if (target) {
      target.revenue += bucket.revenue;
      target.orders += bucket.orders;
    }
  }

  return Array.from(byDate.values());
}

export async function getRecentOrders(
  limit = 10,
  ordersOverride?: Order[]
): Promise<Order[]> {
  const orders =
    ordersOverride ?? (await pgOrder.listRecentOrders(limit));
  return orders.slice(0, limit);
}

export async function getRecentCustomers(limit = 10) {
  const users = await pgUsers.listRecentUsers(limit);
  return users.map((user) => ({
    uid: user.id,
    email: user.email,
    displayName: user.name ?? "",
    createdAt: user.createdAt,
  }));
}

export async function getLowStockProducts(limit = 10) {
  return getInventoryLowStock(limit);
}

export async function getOutOfStockProductList(limit = 10) {
  return getOutOfStockProducts(limit);
}

/**
 * Top products need line items, which live in a JSON column — aggregate in JS
 * but bound the scan to paid orders from the last 90 days (SQL-side filter +
 * hard row cap) instead of reading the entire order table.
 */
export async function getTopProducts(limit = 5) {
  const orders = await pgOrder.findPaidOrders({ sinceDays: 90 });
  return topProductsFromOrders(orders, limit);
}

export function topProductsFromOrders(orders: Order[], limit = 5) {
  const counts = new Map<string, { name: string; units: number; revenue: number }>();

  orders.forEach((order) => {
    order.items.forEach((item) => {
      const existing = counts.get(item.productId) ?? {
        name: item.name,
        units: 0,
        revenue: 0,
      };
      existing.units += item.quantity;
      existing.revenue += item.price * item.quantity;
      counts.set(item.productId, existing);
    });
  });

  return Array.from(counts.values())
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, limit);
}
