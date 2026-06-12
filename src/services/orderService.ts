import type {
  CreateOrderPayload,
  CreateRazorpayOrderResponse,
  Order,
  VerifyPaymentPayload,
  VerifyPaymentResponse,
} from "@/types/order";

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
): Promise<{ orderId: string; order: Order }> {
  const response = await fetch("/api/payment/create-order", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...payload, paymentMethod: "cod" }),
  });
  return parseJson<{ orderId: string; order: Order }>(response);
}

export async function fetchOrder(orderId: string): Promise<Order> {
  const response = await fetch(`/api/orders/${orderId}`);
  return parseJson<{ order: Order }>(response).then((data) => data.order);
}

export async function fetchUserOrders(): Promise<Order[]> {
  const response = await fetch("/api/orders");
  return parseJson<{ orders: Order[] }>(response).then((data) => data.orders);
}
