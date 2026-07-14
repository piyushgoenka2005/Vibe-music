import "server-only";

import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/db/prisma";
import type { FinanceApplication } from "@/types/finance";
import { logInfo } from "@/lib/server/logger";

export async function notifyFinanceApplicationUpdate(
  application: FinanceApplication,
  status: string
): Promise<void> {
  const title =
    status === "approved"
      ? "Finance approved"
      : status === "rejected"
        ? "Finance application declined"
        : "Finance application update";
  const body = `Application ${application.applicationNumber} — ${application.productName}`;

  try {
    if (application.userId) {
      await prisma.userNotification.create({
        data: {
          id: randomUUID(),
          userId: application.userId,
          type: "finance",
          title,
          body,
          link: `/account/financing/${application.id}`,
          read: false,
          createdAt: new Date().toISOString(),
        },
      });
    }
    await prisma.adminNotification.create({
      data: {
        id: randomUUID(),
        type: "finance",
        title,
        body,
        link: `/admin/financing/applications/${application.id}`,
        read: false,
        createdAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    logInfo("Finance notification failed", "finance-notify", {
      applicationId: application.id,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
