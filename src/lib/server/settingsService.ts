import { SELLER_STATE, DEFAULT_GST_RATE } from "@/lib/gstCalculator";
import * as pgContent from "@/lib/server/prisma/contentRepository";
import * as pgOrder from "@/lib/server/prisma/orderRepository";
import type { AnalyticsReport, StoreSettings } from "@/types/admin";
import { getRevenueChartData } from "@/lib/server/dashboardService";
import { isRazorpayConfigured } from "@/lib/server/env";

const DEFAULT_SETTINGS: StoreSettings = {
  storeName: "Vibe Music",
  storeEmail: "support@vibemusic.in",
  storePhone: "",
  storeAddress: "Mumbai, Maharashtra, India",
  gstNumber: "",
  defaultGstRate: DEFAULT_GST_RATE,
  sellerState: SELLER_STATE,
  freeShippingThreshold: 9999,
  standardShippingCharge: 99,
  razorpayEnabled: isRazorpayConfigured(),
  updatedAt: new Date().toISOString(),
};

export async function getStoreSettings(): Promise<StoreSettings> {
  const settings = await pgContent.getStoreSettings();
  return {
    ...DEFAULT_SETTINGS,
    ...(settings ?? {}),
    // Always reflect live env — do not trust a stale DB copy of this flag.
    razorpayEnabled: isRazorpayConfigured(),
  };
}

export async function updateStoreSettings(
  patch: Partial<StoreSettings>
): Promise<StoreSettings> {
  const current = await getStoreSettings();
  const updated: StoreSettings = {
    ...current,
    ...patch,
    updatedAt: new Date().toISOString(),
  };
  await pgContent.upsertStoreSettingsRecord(updated);
  return updated;
}

export async function getAnalyticsReport(period = "30d"): Promise<AnalyticsReport> {
  const days = period === "7d" ? 7 : period === "90d" ? 90 : 30;
  const orders = await pgOrder.listAllOrders();

  const paidOrders = orders.filter(
    (o) => o.paymentStatus === "paid" || o.paymentStatus === "cod_pending"
  );

  const totalRevenue = paidOrders.reduce((sum, o) => sum + (o.total ?? 0), 0);
  const totalOrders = orders.length;
  const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  const productMap = new Map<string, { name: string; units: number; revenue: number }>();
  paidOrders.forEach((order) => {
    (order.items ?? []).forEach((item) => {
      const existing = productMap.get(item.productId) ?? {
        name: item.name,
        units: 0,
        revenue: 0,
      };
      existing.units += item.quantity;
      existing.revenue += item.price * item.quantity;
      productMap.set(item.productId, existing);
    });
  });

  const ordersByStatus: Record<string, number> = {};
  orders.forEach((order) => {
    const status = String(order.status ?? "pending");
    ordersByStatus[status] = (ordersByStatus[status] ?? 0) + 1;
  });

  const revenueByMonth = await getRevenueChartData(days);

  return {
    period,
    totalRevenue,
    totalOrders,
    averageOrderValue,
    topProducts: Array.from(productMap.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10),
    ordersByStatus,
    revenueByMonth,
  };
}
