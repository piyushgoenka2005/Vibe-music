import "server-only";

import * as pgOrder from "@/lib/server/prisma/orderRepository";
import type { Order } from "@/types/order";

export interface PurchaseVerification {
  verified: boolean;
  orderId?: string;
}

export async function hasPurchasedProduct(
  userId: string,
  email: string | null | undefined,
  productId: string
): Promise<PurchaseVerification> {
  const orders = await pgOrder.findPurchasedProductOrders(userId, email, productId);
  const match = orders[0];
  if (!match) return { verified: false };
  return { verified: true, orderId: match.id };
}
