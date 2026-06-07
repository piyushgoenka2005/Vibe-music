import type { Order } from "@/types/order";

export async function trackOrder(
  orderId: string,
  email: string
): Promise<Order | null> {
  const params = new URLSearchParams({ orderId, email });
  const response = await fetch(`/api/orders/track?${params.toString()}`);

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error("Unable to track order");
  }

  const data = (await response.json()) as { order: Order };
  return data.order;
}
