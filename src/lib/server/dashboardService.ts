import { getAdminFirestore } from "@/lib/firebase/admin";
import { getAllProducts } from "@/services/catalogService";
import type { DashboardStats, RevenueDataPoint } from "@/types/admin";
import type { Order } from "@/types/order";

const LOW_STOCK_THRESHOLD = 10;

function parseOrder(doc: FirebaseFirestore.DocumentSnapshot): Order | null {
  const data = doc.data();
  if (!data) return null;
  return { id: doc.id, ...data } as Order;
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const db = getAdminFirestore();

  const [ordersSnap, usersSnap] = await Promise.all([
    db.collection("orders").get(),
    db.collection("users").get(),
  ]);

  const catalogProducts = getAllProducts(true);

  const orders = ordersSnap.docs
    .map(parseOrder)
    .filter((o): o is Order => o !== null);

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

  let lowStockProducts = 0;
  catalogProducts.forEach((product) => {
    if (product.stock <= LOW_STOCK_THRESHOLD) lowStockProducts += 1;
  });

  return {
    totalRevenue,
    totalOrders: orders.length,
    totalCustomers: usersSnap.size,
    totalProducts: catalogProducts.filter((p) => p.status === "active").length,
    pendingOrders: orders.filter((o) => o.status === "pending").length,
    processingOrders: orders.filter((o) => o.status === "processing").length,
    completedOrders: orders.filter(
      (o) => o.status === "delivered" || o.status === "shipped"
    ).length,
    cancelledOrders: orders.filter((o) => o.status === "cancelled").length,
    lowStockProducts,
    revenueChangePercent,
    ordersChangePercent,
  };
}

export async function getRevenueChartData(
  days = 30
): Promise<RevenueDataPoint[]> {
  const db = getAdminFirestore();
  const snap = await db.collection("orders").get();
  const orders = snap.docs
    .map(parseOrder)
    .filter((o): o is Order => o !== null)
    .filter(
      (o) =>
        (o.paymentStatus === "paid" || o.paymentStatus === "cod_pending") &&
        o.createdAt
    );

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
  const db = getAdminFirestore();
  const snap = await db
    .collection("orders")
    .orderBy("createdAt", "desc")
    .limit(limit)
    .get();

  return snap.docs
    .map(parseOrder)
    .filter((o): o is Order => o !== null);
}

export async function getRecentCustomers(limit = 10) {
  const db = getAdminFirestore();
  const snap = await db
    .collection("users")
    .orderBy("createdAt", "desc")
    .limit(limit)
    .get();

  return snap.docs.map((doc) => {
    const data = doc.data();
    return {
      uid: doc.id,
      email: String(data.email ?? ""),
      displayName: String(data.displayName ?? ""),
      createdAt: String(data.createdAt ?? ""),
    };
  });
}

export async function getLowStockProducts(limit = 10) {
  return getAllProducts(true)
    .filter((product) => product.stock <= LOW_STOCK_THRESHOLD)
    .sort((a, b) => a.stock - b.stock)
    .slice(0, limit)
    .map((product) => ({
      id: product.id,
      name: product.name,
      sku: product.sku,
      stockQuantity: product.stock,
      lowStockThreshold: LOW_STOCK_THRESHOLD,
      availability: product.availability,
    }));
}

export async function getTopProducts(limit = 5) {
  const db = getAdminFirestore();
  const snap = await db.collection("orders").get();
  const counts = new Map<string, { name: string; units: number; revenue: number }>();

  snap.docs.forEach((doc) => {
    const data = doc.data();
    if (data.paymentStatus !== "paid" && data.paymentStatus !== "cod_pending") return;
    (data.items as Array<{ productId: string; name: string; quantity: number; price: number }> ?? []).forEach(
      (item) => {
        const existing = counts.get(item.productId) ?? {
          name: item.name,
          units: 0,
          revenue: 0,
        };
        existing.units += item.quantity;
        existing.revenue += item.price * item.quantity;
        counts.set(item.productId, existing);
      }
    );
  });

  return Array.from(counts.values())
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, limit);
}
