import "server-only";

import { getAvailableStock } from "@/lib/inventory/stockMath";
import { notifyUserIfAllowed } from "@/lib/server/notificationRepository";
import {
  sendProductAvailableEmail,
  sendRestockAvailableEmail,
} from "@/lib/server/restockEmailService";
import {
  listPendingStockAlerts,
  markStockAlertsNotified,
} from "@/lib/server/stockAlertRepository";
import { prisma } from "@/lib/db/prisma";
import { isPurchasablePrice } from "@/utils/currency";

export function didBecomeAvailable(input: {
  previousStock: number;
  previousReserved?: number;
  newStock: number;
  newReserved?: number;
}): boolean {
  const previousAvailable = getAvailableStock(
    input.previousStock,
    input.previousReserved ?? 0
  );
  const newAvailable = getAvailableStock(
    input.newStock,
    input.newReserved ?? 0
  );
  return previousAvailable <= 0 && newAvailable > 0;
}

export function didBecomePurchasable(input: {
  previousPrice: number;
  newPrice: number;
}): boolean {
  return (
    !isPurchasablePrice(input.previousPrice) &&
    isPurchasablePrice(input.newPrice)
  );
}

async function resolveUserIdForEmail(
  email: string,
  existingUserId: string | null
): Promise<string | null> {
  if (existingUserId) return existingUserId;
  const user = await prisma.user.findUnique({
    where: { email: email.trim().toLowerCase() },
    select: { id: true },
  });
  return user?.id ?? null;
}

async function fanOutWaitlist(input: {
  productId: string;
  productName: string;
  productSlug: string;
  mode: "restock" | "go-live";
}): Promise<number> {
  const alerts = await listPendingStockAlerts(input.productId);
  if (alerts.length === 0) return 0;

  const notifiedIds: string[] = [];
  const sendEmail =
    input.mode === "go-live"
      ? sendProductAvailableEmail
      : sendRestockAvailableEmail;
  const title = input.mode === "go-live" ? "Now available" : "Back in stock";
  const body =
    input.mode === "go-live"
      ? `${input.productName} is now available to buy.`
      : `${input.productName} is available again.`;

  for (const alert of alerts) {
    try {
      const emailed = await sendEmail({
        email: alert.email,
        productName: input.productName || alert.productName,
        productSlug: input.productSlug || alert.productSlug,
      });

      if (!emailed) continue;

      const userId = await resolveUserIdForEmail(alert.email, alert.userId);
      if (userId) {
        void notifyUserIfAllowed({
          userId,
          type: "product_alert",
          title,
          body,
          link: `/product/${input.productSlug || alert.productSlug}`,
        });
      }

      notifiedIds.push(alert.id);
    } catch (error) {
      console.error(
        `[waitlist] Failed for alert ${alert.id} → ${alert.email}`,
        error
      );
    }
  }

  await markStockAlertsNotified(notifiedIds);
  return notifiedIds.length;
}

/**
 * Fan out Notify Me waitlist emails (+ in-app product_alert) when stock
 * crosses from unavailable → available.
 */
export async function notifyWaitlistOnRestock(input: {
  productId: string;
  productName: string;
  productSlug: string;
  previousStock: number;
  previousReserved?: number;
  newStock: number;
  newReserved?: number;
}): Promise<number> {
  if (
    !didBecomeAvailable({
      previousStock: input.previousStock,
      previousReserved: input.previousReserved,
      newStock: input.newStock,
      newReserved: input.newReserved,
    })
  ) {
    return 0;
  }

  return fanOutWaitlist({
    productId: input.productId,
    productName: input.productName,
    productSlug: input.productSlug,
    mode: "restock",
  });
}

/**
 * Fan out Notify Me waitlist when a Coming Soon SKU gets a real price.
 */
export async function notifyWaitlistOnGoLive(input: {
  productId: string;
  productName: string;
  productSlug: string;
  previousPrice: number;
  newPrice: number;
}): Promise<number> {
  if (
    !didBecomePurchasable({
      previousPrice: input.previousPrice,
      newPrice: input.newPrice,
    })
  ) {
    return 0;
  }

  return fanOutWaitlist({
    productId: input.productId,
    productName: input.productName,
    productSlug: input.productSlug,
    mode: "go-live",
  });
}
