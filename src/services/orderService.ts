import type {
  CreateOrderPayload,
  CreateRazorpayOrderResponse,
  DemoPaymentResponse,
  Order,
  ResumePaymentResponse,
  VerifyPaymentPayload,
  VerifyPaymentResponse,
} from "@/types/order";
import type { InvoiceUrls } from "@/features/invoice/types";

export type OrderFetchResult = {
  order: Order;
  invoiceUrls: InvoiceUrls | null;
};

async function parseJson<T>(response: Response): Promise<T> {
  const data = (await response.json()) as T & { error?: string };
  if (!response.ok) {
    throw new Error(data.error ?? "Request failed");
  }
  return data;
}

export async function createPaymentOrder(
  payload: CreateOrderPayload
): Promise<CreateRazorpayOrderResponse> {
  const response = await fetch("/api/payment/create-order", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return parseJson<CreateRazorpayOrderResponse>(response);
}

export async function verifyPayment(
  payload: VerifyPaymentPayload
): Promise<VerifyPaymentResponse> {
  const response = await fetch("/api/payment/verify-payment", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return parseJson<VerifyPaymentResponse>(response);
}

export async function createCodOrder(
  payload: CreateOrderPayload
): Promise<{ orderId: string; trackingToken?: string; order: Order }> {
  const response = await fetch("/api/payment/create-order", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...payload, paymentMethod: "cod" }),
  });
  return parseJson<{ orderId: string; order: Order }>(response);
}

export async function releaseOrderReservation(
  orderId: string,
  trackingToken: string
): Promise<void> {
  const response = await fetch("/api/payment/release-reservation", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ orderId, trackingToken }),
  });
  if (!response.ok) {
    const data = (await response.json()) as { error?: string };
    throw new Error(data.error ?? "Failed to release reservation");
  }
}

export async function completeDemoPayment(
  orderId: string,
  email: string,
  trackingToken?: string
): Promise<DemoPaymentResponse> {
  const response = await fetch("/api/payment/demo", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ orderId, email, trackingToken }),
  });
  return parseJson<DemoPaymentResponse>(response);
}

export async function resumePayment(
  orderId: string,
  context: { email?: string; trackingToken?: string }
): Promise<ResumePaymentResponse> {
  const response = await fetch(`/api/orders/${orderId}/resume-payment`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(context),
  });
  return parseJson<ResumePaymentResponse>(response);
}

export async function fetchOrder(orderId: string): Promise<OrderFetchResult> {
  const response = await fetch(`/api/orders/${orderId}`);
  return parseJson<OrderFetchResult>(response);
}

export async function fetchGuestOrder(
  orderId: string,
  context: { email?: string; trackingToken?: string }
): Promise<OrderFetchResult> {
  const params = new URLSearchParams();
  if (context.email) params.set("email", context.email);
  if (context.trackingToken) params.set("trackingToken", context.trackingToken);
  const query = params.toString();
  const response = await fetch(
    `/api/orders/${orderId}${query ? `?${query}` : ""}`
  );
  return parseJson<OrderFetchResult>(response);
}

export async function fetchUserOrders(): Promise<Order[]> {
  const response = await fetch("/api/orders");
  return parseJson<{ orders: Order[] }>(response).then((data) => data.orders);
}
