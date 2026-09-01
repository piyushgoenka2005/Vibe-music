import { SELLER_STATE, DEFAULT_GST_RATE } from "@/lib/gstCalculator";
import * as pgContent from "@/lib/server/prisma/contentRepository";
import * as pgOrder from "@/lib/server/prisma/orderRepository";
import type { AnalyticsReport, StoreSettings } from "@/types/admin";
import {
  getRevenueChartData,
  topProductsFromOrders,
} from "@/lib/server/dashboardService";
import { isRazorpayConfigured } from "@/lib/server/env";
import { getCached, invalidateCache } from "@/lib/server/redisCache";

const DEFAULT_SETTINGS: StoreSettings = {
  storeName: "Vibe Music",
  storeEmail: "support@vibemusic.in",
  storePhone: "",
  storeAddress: "Sikkim Commerce House, 4/1 Middleton Street, 3rd Floor, Room 303, Kolkata – 700071",
  gstNumber: "",
  defaultGstRate: DEFAULT_GST_RATE,
  sellerState: SELLER_STATE,
  freeShippingThreshold: 0,
  standardShippingCharge: 0,
  razorpayEnabled: isRazorpayConfigured(),
  updatedAt: new Date().toISOString(),
};

const SETTINGS_CACHE_KEY = "store-settings";
const SETTINGS_CACHE_TTL = 300; // 5 minutes — settings change rarely

export async function getStoreSettings(): Promise<StoreSettings> {
  return getCached(
    SETTINGS_CACHE_KEY,
    async () => {
      const settings = await pgContent.getStoreSettings();
      return {
        ...DEFAULT_SETTINGS,
        ...(settings ?? {}),
        // Storefront shipping is free — ignore any legacy paid charges in DB.
        freeShippingThreshold: 0,
        standardShippingCharge: 0,
        // Always reflect live env — do not trust a stale DB copy of this flag.
        razorpayEnabled: isRazorpayConfigured(),
      };
    },
    SETTINGS_CACHE_TTL
  );
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
  // Bust the cache so subsequent reads get fresh data
  await invalidateCache(SETTINGS_CACHE_KEY);
  return updated;
}

export async function getAnalyticsReport(period = "30d"): Promise<AnalyticsReport> {
  const days = period === "7d" ? 7 : period === "90d" ? 90 : 30;

  // SQL aggregates instead of loading the entire orders table into memory.
  const [totalRevenue, totalOrders, statusCounts, revenueByMonth, paidOrdersWindow] =
    await Promise.all([
      pgOrder.sumPaidRevenue(),
      pgOrder.countOrdersBetween(),
      pgOrder.countOrdersGroupedByStatus(),
      getRevenueChartData(days),
      pgOrder.findPaidOrders({ sinceDays: 90 }),
    ]);

  const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  return {
    period,
    totalRevenue,
    totalOrders,
    averageOrderValue,
    topProducts: topProductsFromOrders(paidOrdersWindow, 10),
    ordersByStatus: statusCounts,
    revenueByMonth,
  };
}
