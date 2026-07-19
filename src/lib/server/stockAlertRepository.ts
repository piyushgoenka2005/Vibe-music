import "server-only";

import { randomUUID } from "crypto";
import { prisma } from "@/lib/db/prisma";

export interface ProductStockAlertRecord {
  id: string;
  email: string;
  productId: string;
  productSlug: string;
  productName: string;
  userId: string | null;
  createdAt: string;
  notifiedAt: string | null;
}

export async function upsertProductStockAlert(input: {
  email: string;
  productId: string;
  productSlug: string;
  productName: string;
  userId?: string | null;
}): Promise<{ created: boolean; alert: ProductStockAlertRecord }> {
  const email = input.email.trim().toLowerCase();
  const now = new Date().toISOString();

  const existing = await prisma.productStockAlert.findUnique({
    where: {
      email_productId: {
        email,
        productId: input.productId,
      },
    },
  });

  if (existing) {
    const updated = await prisma.productStockAlert.update({
      where: { id: existing.id },
      data: {
        productSlug: input.productSlug,
        productName: input.productName,
        userId: input.userId ?? existing.userId,
        // Re-subscribe: clear prior notification so restock can fire again
        notifiedAt: null,
      },
    });
    return {
      created: false,
      alert: {
        id: updated.id,
        email: updated.email,
        productId: updated.productId,
        productSlug: updated.productSlug,
        productName: updated.productName,
        userId: updated.userId,
        createdAt: updated.createdAt,
        notifiedAt: updated.notifiedAt,
      },
    };
  }

  const created = await prisma.productStockAlert.create({
    data: {
      id: randomUUID(),
      email,
      productId: input.productId,
      productSlug: input.productSlug,
      productName: input.productName,
      userId: input.userId ?? null,
      createdAt: now,
      notifiedAt: null,
    },
  });

  return {
    created: true,
    alert: {
      id: created.id,
      email: created.email,
      productId: created.productId,
      productSlug: created.productSlug,
      productName: created.productName,
      userId: created.userId,
      createdAt: created.createdAt,
      notifiedAt: created.notifiedAt,
    },
  };
}

export async function listPendingStockAlerts(
  productId: string
): Promise<ProductStockAlertRecord[]> {
  const rows = await prisma.productStockAlert.findMany({
    where: { productId, notifiedAt: null },
    orderBy: { createdAt: "asc" },
  });

  return rows.map((row) => ({
    id: row.id,
    email: row.email,
    productId: row.productId,
    productSlug: row.productSlug,
    productName: row.productName,
    userId: row.userId,
    createdAt: row.createdAt,
    notifiedAt: row.notifiedAt,
  }));
}

export async function markStockAlertsNotified(
  alertIds: string[]
): Promise<void> {
  if (alertIds.length === 0) return;
  const now = new Date().toISOString();
  await prisma.productStockAlert.updateMany({
    where: { id: { in: alertIds } },
    data: { notifiedAt: now },
  });
}
