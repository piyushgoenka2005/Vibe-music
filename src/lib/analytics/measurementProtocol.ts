import "server-only";

import {
  getGaMeasurementApiSecret,
  getGaMeasurementId,
} from "@/lib/analytics/config";
import { orderToGa4Items } from "@/lib/analytics/items";
import type { Order } from "@/types/order";

const MP_ENDPOINT = "https://www.google-analytics.com/mp/collect";

export async function sendServerPurchaseEvent(order: Order): Promise<void> {
  const measurementId = getGaMeasurementId();
  const apiSecret = getGaMeasurementApiSecret();
  if (!measurementId || !apiSecret) return;

  const clientId = order.userId ?? order.email ?? order.id;

  const payload = {
    client_id: clientId,
    user_id: order.userId ?? undefined,
    events: [
      {
        name: "purchase",
        params: {
          currency: "INR",
          transaction_id: order.id,
          value: order.total,
          coupon: order.couponCode ?? undefined,
          shipping: order.shippingCharge,
          tax: order.totalGst,
          items: orderToGa4Items(order),
          engagement_time_msec: 1,
        },
      },
    ],
  };

  const url = `${MP_ENDPOINT}?measurement_id=${encodeURIComponent(measurementId)}&api_secret=${encodeURIComponent(apiSecret)}`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      console.warn(
        `[analytics] Measurement Protocol purchase failed: HTTP ${response.status}`
      );
    }
  } catch (error) {
    console.warn("[analytics] Measurement Protocol purchase error", error);
  }
}
