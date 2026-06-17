import { getAdminFirestore } from "@/lib/firebase/admin";
import { SELLER_STATE, DEFAULT_GST_RATE } from "@/lib/gstCalculator";
import {
  isGlobalFirestoreCircuitOpen,
  logFirestoreWarning,
  markFirestoreUnavailable,
} from "@/lib/server/firestoreErrors";
import type { AnalyticsReport, StoreSettings } from "@/types/admin";
import { getRevenueChartData } from "@/lib/server/dashboardService";

const SETTINGS_DOC = "store";
const COLLECTION = "settings";

const DEFAULT_SETTINGS: StoreSettings = {
  storeName: "Vibe Music",
  storeEmail: "support@vibemusic.in",
  storePhone: "+91 98765 43210",
  storeAddress: "Mumbai, Maharashtra, India",
  gstNumber: "",
  defaultGstRate: DEFAULT_GST_RATE,
  sellerState: SELLER_STATE,
  freeShippingThreshold: 5000,
  standardShippingCharge: 99,
  razorpayEnabled: Boolean(process.env.RAZORPAY_KEY_ID),
  updatedAt: new Date().toISOString(),
};

export async function getStoreSettings(): Promise<StoreSettings> {
  if (isGlobalFirestoreCircuitOpen()) {
    return DEFAULT_SETTINGS;
  }

  try {
    const db = getAdminFirestore();
    const doc = await db.collection(COLLECTION).doc(SETTINGS_DOC).get();
    if (!doc.exists) {
      return DEFAULT_SETTINGS;
    }
    return { ...DEFAULT_SETTINGS, ...doc.data() } as StoreSettings;
  } catch (error) {
    if (markFirestoreUnavailable(error)) {
      logFirestoreWarning(
        "settings",
        error,
        "Using default store settings — Firestore unavailable"
      );
      return DEFAULT_SETTINGS;
    }
    throw error;
  }
}

export async function updateStoreSettings(
  patch: Partial<StoreSettings>
): Promise<StoreSettings> {
  const db = getAdminFirestore();
  const current = await getStoreSettings();
  const updated: StoreSettings = {
    ...current,
    ...patch,
    updatedAt: new Date().toISOString(),
  };
  await db.collection(COLLECTION).doc(SETTINGS_DOC).set(updated);
  return updated;
}

export async function getAnalyticsReport(period = "30d"): Promise<AnalyticsReport> {
  const db = getAdminFirestore();
  const days = period === "7d" ? 7 : period === "90d" ? 90 : 30;
  const snap = await db.collection("orders").get();

  const orders = snap.docs.map((doc) => doc.data()) as Array<{
    total: number;
    status: string;
    paymentStatus: string;
    items: Array<{ name: string; quantity: number; price: number; productId: string }>;
  }>;

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
  snap.docs.forEach((doc) => {
    const status = String(doc.data().status ?? "pending");
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
