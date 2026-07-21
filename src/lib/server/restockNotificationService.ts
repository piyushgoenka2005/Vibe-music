import "server-only";

import { getAvailableStock } from "@/lib/inventory/stockMath";
import { notifyUserIfAllowed } from "@/lib/server/notificationRepository";
import { sendRestockAvailableEmail } from "@/lib/server/restockEmailService";
import {
  listPendingStockAlerts,
  markStockAlertsNotified,
} from "@/lib/server/stockAlertRepository";
import { prisma } from "@/lib/db/prisma";

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

  const alerts = await listPendingStockAlerts(input.productId);
  if (alerts.length === 0) return 0;

  const notifiedIds: string[] = [];

  for (const alert of alerts) {
    try {
      const emailed = await sendRestockAvailableEmail({
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
          title: "Back in stock",
          body: `${input.productName || alert.productName} is available again.`,
          link: `/product/${input.productSlug || alert.productSlug}`,
        });
      }

      notifiedIds.push(alert.id);
    } catch (error) {
      console.error(
        `[restock] Failed for alert ${alert.id} → ${alert.email}`,
        error
      );
    }
  }

  await markStockAlertsNotified(notifiedIds);
  return notifiedIds.length;
}
