import "server-only";

import {
  getGaMeasurementApiSecret,
  getGaMeasurementId,
} from "@/lib/analytics/config";
import { orderToGa4Items } from "@/lib/analytics/items";
import type { Order } from "@/types/order";

const MP_ENDPOINT = "https://www.google-analytics.com/mp/collect";

async function sendMeasurementProtocolEvent(
  order: Order,
  eventName: "purchase" | "refund",
  params: Record<string, unknown>
): Promise<void> {
  const measurementId = getGaMeasurementId();
  const apiSecret = getGaMeasurementApiSecret();
  if (!measurementId || !apiSecret) return;

  const clientId = order.userId ?? order.email ?? order.id;
  const url = `${MP_ENDPOINT}?measurement_id=${encodeURIComponent(measurementId)}&api_secret=${encodeURIComponent(apiSecret)}`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: clientId,
        user_id: order.userId ?? undefined,
        events: [
          {
            name: eventName,
            params: {
              ...params,
              engagement_time_msec: 1,
            },
          },
        ],
      }),
    });
    if (!response.ok) {
      console.warn(
        `[analytics] Measurement Protocol ${eventName} failed: HTTP ${response.status}`
      );
    }
  } catch (error) {
    console.warn(`[analytics] Measurement Protocol ${eventName} error`, error);
  }
}

export async function sendServerPurchaseEvent(order: Order): Promise<void> {
  await sendMeasurementProtocolEvent(order, "purchase", {
    currency: "INR",
    transaction_id: order.id,
    value: order.total,
    coupon: order.couponCode ?? undefined,
    shipping: order.shippingCharge,
    tax: order.totalGst,
    items: orderToGa4Items(order),
  });
}

export async function sendServerRefundEvent(order: Order): Promise<void> {
  await sendMeasurementProtocolEvent(order, "refund", {
    currency: "INR",
    transaction_id: order.id,
    value: order.total,
    items: orderToGa4Items(order),
  });
}
