import "server-only";

import fs from "fs";
import path from "path";
import { getAdminFirestore } from "@/lib/firebase/admin";
import {
  formatOrderId,
  getOrderYear,
  ORDER_ID_SEQUENCE_START,
} from "@/lib/orderId";
import {
  isGlobalFirestoreCircuitOpen,
  tryFirestoreFast,
} from "@/lib/server/firestoreErrors";
import { withFirestoreRetry } from "@/lib/server/firestoreRetry";
import { logPayment, logPaymentError } from "@/lib/server/paymentDiagnostics";

const COUNTERS_COLLECTION = "counters";
const COUNTERS_DIR = path.join(process.cwd(), ".data", "counters");

function counterDocId(year: number): string {
  return `orders-${year}`;
}

function localCounterPath(year: number): string {
  return path.join(COUNTERS_DIR, `${counterDocId(year)}.json`);
}

function readLocalCounter(year: number): number {
  const filePath = localCounterPath(year);
  if (!fs.existsSync(filePath)) return ORDER_ID_SEQUENCE_START - 1;
  try {
    const parsed = JSON.parse(fs.readFileSync(filePath, "utf8")) as {
      lastSequence?: number;
    };
    return Number(parsed.lastSequence ?? ORDER_ID_SEQUENCE_START - 1);
  } catch {
    return ORDER_ID_SEQUENCE_START - 1;
  }
}

function writeLocalCounter(year: number, lastSequence: number): void {
  fs.mkdirSync(COUNTERS_DIR, { recursive: true });
  fs.writeFileSync(
    localCounterPath(year),
    `${JSON.stringify(
      {
        lastSequence,
        year,
        updatedAt: new Date().toISOString(),
      },
      null,
      2
    )}\n`,
    "utf8"
  );
}

function allocateLocalOrderId(createdAt = new Date()): string {
  const year = getOrderYear(createdAt);
  const lastSequence = readLocalCounter(year);
  const nextSequence = Math.max(lastSequence + 1, ORDER_ID_SEQUENCE_START);
  writeLocalCounter(year, nextSequence);
  return formatOrderId(nextSequence, year);
}

async function allocateFromFirestore(createdAt: Date): Promise<string> {
  const year = getOrderYear(createdAt);
  const db = getAdminFirestore();
  const counterRef = db.collection(COUNTERS_COLLECTION).doc(counterDocId(year));

  logPayment("Firestore order counter transaction started", { year });

  return withFirestoreRetry(async () => {
    return db.runTransaction(async (transaction) => {
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

      const orderId = formatOrderId(nextSequence, year);
      logPayment("Firestore order counter transaction completed", { orderId });
      return orderId;
    });
  }, { maxRetries: 4, baseDelayMs: 250 }).catch((error) => {
    logPaymentError(error, { step: "allocateFromFirestore", year });
    throw error;
  });
}

export async function allocateNextOrderId(
  createdAt = new Date()
): Promise<string> {
  if (isGlobalFirestoreCircuitOpen()) {
    return allocateLocalOrderId(createdAt);
  }

  return tryFirestoreFast(
    () => allocateFromFirestore(createdAt),
    {
      domain: "orders",
      context: "allocate order id",
      fallback: () => allocateLocalOrderId(createdAt),
    }
  );
}
