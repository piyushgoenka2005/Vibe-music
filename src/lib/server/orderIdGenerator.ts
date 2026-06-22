import "server-only";

import { getAdminFirestore } from "@/lib/firebase/admin";
import {
  formatOrderId,
  getOrderYear,
  ORDER_ID_SEQUENCE_START,
} from "@/lib/orderId";
import { withFirestoreRetry } from "@/lib/server/firestoreRetry";
import { logPayment, logPaymentError } from "@/lib/server/paymentDiagnostics";

const COUNTERS_COLLECTION = "counters";

function counterDocId(year: number): string {
  return `orders-${year}`;
}

export async function allocateNextOrderId(
  createdAt = new Date()
): Promise<string> {
  const year = getOrderYear(createdAt);
  const db = getAdminFirestore();
  const counterRef = db.collection(COUNTERS_COLLECTION).doc(counterDocId(year));

  logPayment("Firestore order counter transaction started", { year });

  return withFirestoreRetry(async () => {
    const orderId = await db.runTransaction(async (transaction) => {
      const snapshot = await transaction.get(counterRef);
      const lastSequence = snapshot.exists
        ? Number(snapshot.data()?.lastSequence ?? ORDER_ID_SEQUENCE_START - 1)
        : ORDER_ID_SEQUENCE_START - 1;

      const nextSequence = Math.max(lastSequence + 1, ORDER_ID_SEQUENCE_START);

      transaction.set(
        counterRef,
        {
          lastSequence: nextSequence,
          year,
          updatedAt: createdAt.toISOString(),
        },
        { merge: true }
      );

      return formatOrderId(nextSequence, year);
    });

    logPayment("Firestore order counter transaction completed", { orderId });
    return orderId;
  }, { maxRetries: 4, baseDelayMs: 250 }).catch((error) => {
    logPaymentError(error, { step: "allocateNextOrderId", year });
    throw error;
  });
}
