import {
  getInventoryStats,
  getLowStockProducts as getInventoryLowStock,
  getOutOfStockProducts,
} from "@/lib/server/inventoryService";
import * as pgOrder from "@/lib/server/prisma/orderRepository";
import * as pgUsers from "@/lib/server/prisma/usersRepository";
import { getAllProducts } from "@/services/catalogService";
import type { DashboardStats, RevenueDataPoint } from "@/types/admin";
import type { Order } from "@/types/order";

export async function getDashboardStats(): Promise<DashboardStats> {
  const [orders, totalCustomers, catalogProducts] = await Promise.all([
    pgOrder.listAllOrders(),
    pgUsers.countUsers(),
    getAllProducts(true),
  ]);

  const now = new Date();
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const sixtyDaysAgo = new Date(now);
  sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

  const paidOrders = orders.filter(
    (o) => o.paymentStatus === "paid" || o.paymentStatus === "cod_pending"
  );

  const totalRevenue = paidOrders.reduce((sum, o) => sum + o.total, 0);

  const recentRevenue = paidOrders
    .filter((o) => o.createdAt && new Date(o.createdAt) >= thirtyDaysAgo)
    .reduce((sum, o) => sum + o.total, 0);

  const priorRevenue = paidOrders
    .filter((o) => {
      if (!o.createdAt) return false;
      const d = new Date(o.createdAt);
      return d >= sixtyDaysAgo && d < thirtyDaysAgo;
    })
    .reduce((sum, o) => sum + o.total, 0);

  const recentOrders = orders.filter(
    (o) => o.createdAt && new Date(o.createdAt) >= thirtyDaysAgo
  ).length;

  const priorOrders = orders.filter((o) => {
    if (!o.createdAt) return false;
    const d = new Date(o.createdAt);
    return d >= sixtyDaysAgo && d < thirtyDaysAgo;
  }).length;

  const revenueChangePercent =
    priorRevenue > 0
      ? Math.round(((recentRevenue - priorRevenue) / priorRevenue) * 100)
      : recentRevenue > 0
        ? 100
        : 0;

  const ordersChangePercent =
    priorOrders > 0
      ? Math.round(((recentOrders - priorOrders) / priorOrders) * 100)
      : recentOrders > 0
        ? 100
        : 0;

  const inventoryStats = await getInventoryStats();

  return {
    totalRevenue,
    totalOrders: orders.length,
    totalCustomers,
    totalProducts: catalogProducts.filter((p) => p.status === "active").length,
    pendingOrders: orders.filter((o) => o.status === "pending").length,
    processingOrders: orders.filter((o) => o.status === "processing").length,
    completedOrders: orders.filter(
      (o) => o.status === "delivered" || o.status === "shipped"
    ).length,
    cancelledOrders: orders.filter((o) => o.status === "cancelled").length,
    lowStockProducts: inventoryStats.lowStock,
    outOfStockProducts: inventoryStats.outOfStock,
    revenueChangePercent,
    ordersChangePercent,
  };
}

export async function getRevenueChartData(
  days = 30
): Promise<RevenueDataPoint[]> {
  const orders = (await pgOrder.findPaidOrders()).filter((o) => o.createdAt);

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days + 1);
  startDate.setHours(0, 0, 0, 0);

  const buckets = new Map<string, RevenueDataPoint>();

  for (let i = 0; i < days; i++) {
    const d = new Date(startDate);
    d.setDate(d.getDate() + i);
    const key = d.toISOString().slice(0, 10);
    buckets.set(key, { date: key, revenue: 0, orders: 0 });
  }

  orders.forEach((order) => {
    const key = order.createdAt!.slice(0, 10);
    const bucket = buckets.get(key);
    if (bucket) {
      bucket.revenue += order.total;
      bucket.orders += 1;
    }
  });

  return Array.from(buckets.values());
}

export async function getRecentOrders(limit = 10): Promise<Order[]> {
  const orders = await pgOrder.listAllOrders();
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

export async function getTopProducts(limit = 5) {
  const orders = await pgOrder.findPaidOrders();
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
