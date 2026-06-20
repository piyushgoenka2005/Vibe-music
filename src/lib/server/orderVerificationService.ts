import "server-only";

import { getAdminFirestore } from "@/lib/firebase/admin";
import type { Order, OrderStatus } from "@/types/order";

const VERIFIED_STATUSES: OrderStatus[] = ["delivered", "shipped", "confirmed"];

export interface PurchaseVerification {
  verified: boolean;
  orderId?: string;
}

export async function hasPurchasedProduct(
  userId: string,
  email: string | null | undefined,
  productId: string
): Promise<PurchaseVerification> {
  const db = getAdminFirestore();
  const orders = new Map<string, Order>();

  const byUser = await db.collection("orders").where("userId", "==", userId).get();
  for (const doc of byUser.docs) {
    orders.set(doc.id, { id: doc.id, ...doc.data() } as Order);
  }

  const normalizedEmail = email?.trim().toLowerCase();
  if (normalizedEmail) {
    const byEmail = await db
      .collection("orders")
      .where("email", "==", normalizedEmail)
      .get();
    for (const doc of byEmail.docs) {
      if (!orders.has(doc.id)) {
        orders.set(doc.id, { id: doc.id, ...doc.data() } as Order);
      }
    }
  }

  for (const order of orders.values()) {
    if (order.paymentStatus !== "paid") continue;
    if (!VERIFIED_STATUSES.includes(order.status)) continue;
    const hasProduct = order.items.some((item) => item.productId === productId);
    if (hasProduct) {
      return { verified: true, orderId: order.id };
    }
  }

  return { verified: false };
}
