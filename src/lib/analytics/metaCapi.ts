import "server-only";

import { BRAND } from "@/lib/brand";
import { hashMetaEmail, hashMetaPhone } from "@/lib/analytics/metaCapiHash";
import { metaPurchaseEventId } from "@/lib/analytics/metaEventId";
import { getMetaPixelId } from "@/lib/analytics/metaPixel";
import type { Order } from "@/types/order";

const GRAPH_API_VERSION = "v21.0";

export type MetaCapiEventName =
  "PageView" | "ViewContent" | "AddToCart" | "InitiateCheckout" | "Purchase";

export function getMetaCapiAccessToken(): string | undefined {
  const token = process.env.META_CAPI_ACCESS_TOKEN?.trim();
  return token || undefined;
}

export function getMetaTestEventCode(): string | undefined {
  const code = process.env.META_TEST_EVENT_CODE?.trim();
  return code || undefined;
}

export function isMetaCapiConfigured(): boolean {
  return Boolean(getMetaPixelId() && getMetaCapiAccessToken());
}

export interface MetaCapiUserData {
  email?: string;
  phone?: string;
  fbp?: string;
  fbc?: string;
  clientIpAddress?: string;
  clientUserAgent?: string;
}

export interface MetaCapiSendOptions {
  eventName: MetaCapiEventName;
  eventId: string;
  eventTime?: number;
  eventSourceUrl?: string;
  userData?: MetaCapiUserData;
  customData?: Record<string, unknown>;
}

function buildUserData(userData?: MetaCapiUserData): Record<string, string> {
  const out: Record<string, string> = {};
  if (userData?.email) out.em = hashMetaEmail(userData.email);
  if (userData?.phone) out.ph = hashMetaPhone(userData.phone);
  if (userData?.fbp) out.fbp = userData.fbp;
  if (userData?.fbc) out.fbc = userData.fbc;
  if (userData?.clientIpAddress) out.client_ip_address = userData.clientIpAddress;
  if (userData?.clientUserAgent) out.client_user_agent = userData.clientUserAgent;
  return out;
}

export async function sendMetaCapiEvent(options: MetaCapiSendOptions): Promise<void> {
  const pixelId = getMetaPixelId();
  const accessToken = getMetaCapiAccessToken();
  if (!pixelId || !accessToken) return;

  const testEventCode = getMetaTestEventCode();
  const url = `https://graph.facebook.com/${GRAPH_API_VERSION}/${pixelId}/events?access_token=${encodeURIComponent(accessToken)}`;

  const body: Record<string, unknown> = {
    data: [
      {
        event_name: options.eventName,
        event_time: options.eventTime ?? Math.floor(Date.now() / 1000),
        event_id: options.eventId,
        action_source: "website",
        event_source_url: options.eventSourceUrl ?? BRAND.siteUrl,
        user_data: buildUserData(options.userData),
        custom_data: options.customData ?? {},
      },
    ],
  };
  if (testEventCode) {
    body.test_event_code = testEventCode;
  }

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      const text = await response.text().catch(() => "");
      console.warn(
        `[meta-capi] ${options.eventName} failed: HTTP ${response.status} ${text.slice(0, 200)}`,
      );
    }
  } catch (error) {
    console.warn(`[meta-capi] ${options.eventName} error`, error);
  }
}

export async function sendServerMetaPurchaseEvent(order: Order): Promise<void> {
  await sendMetaCapiEvent({
    eventName: "Purchase",
    eventId: metaPurchaseEventId(order.id),
    eventSourceUrl: `${BRAND.siteUrl}/checkout/success?orderId=${encodeURIComponent(order.id)}`,
    userData: {
      email: order.email,
      phone: order.customerPhone ?? order.shippingAddress?.phone,
    },
    customData: {
      value: order.total,
      currency: "INR",
      content_ids: order.items.map((item) => item.productId),
      content_type: "product",
      num_items: order.items.reduce((sum, item) => sum + item.quantity, 0),
      order_id: order.id,
    },
  });
}
