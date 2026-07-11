import "server-only";

import { prisma } from "@/lib/db/prisma";
import {
  formatOrderId,
  getOrderYear,
  ORDER_ID_SEQUENCE_START,
} from "@/lib/orderId";
import { logPayment, logPaymentError } from "@/lib/server/paymentDiagnostics";

function counterId(year: number): string {
  return `orders-${year}`;
}

export async function allocateNextOrderId(
  createdAt = new Date()
): Promise<string> {
  const year = getOrderYear(createdAt);
  const id = counterId(year);

  logPayment("PostgreSQL order counter transaction started", { year });

  try {
    const orderId = await prisma.$transaction(async (tx) => {
      const existing = await tx.counter.findUnique({ where: { id } });
      const lastSequence = existing?.value ?? ORDER_ID_SEQUENCE_START - 1;
      const nextSequence = Math.max(lastSequence + 1, ORDER_ID_SEQUENCE_START);

      await tx.counter.upsert({
        where: { id },
        create: { id, value: nextSequence },
        update: { value: nextSequence },
      });

      return formatOrderId(nextSequence, year);
    });

    logPayment("PostgreSQL order counter transaction completed", { orderId });
    return orderId;
  } catch (error) {
    logPaymentError(error, { step: "allocateNextOrderId", year });
    throw error;
  }
}
