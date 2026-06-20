import "server-only";

import {
  formatOrderId,
  getOrderYear,
  ORDER_ID_SEQUENCE_START,
} from "@/lib/orderId";
import fs from "fs";
import path from "path";

import { getAdminFirestore } from "@/lib/firebase/admin";
import type { WriteResult } from "firebase-admin/firestore";
import {
  createFirestoreCircuitBreaker,
  isFirestoreUnavailableError,
  isGlobalFirestoreCircuitOpen,
  logFirestoreWarning,
  openGlobalFirestoreCircuit,
  tryFirestoreFast,
} from "@/lib/server/firestoreErrors";
import { withFirestoreRetry } from "@/lib/server/firestoreRetry";
import { sanitizeForFirestore } from "@/lib/server/firestoreSanitize";
import type { Order } from "@/types/order";

const COLLECTION = "orders";
const ORDERS_DIR = path.join(process.cwd(), ".data", "orders");

const ordersCircuit = createFirestoreCircuitBreaker();

function isOrdersFirestoreDisabled(): boolean {
  return (
    process.env.DISABLE_FIRESTORE_ORDERS === "true" ||
    ordersCircuit.isOpen() ||
    isGlobalFirestoreCircuitOpen()
  );
}

function ensureOrdersDir(): void {
  fs.mkdirSync(ORDERS_DIR, { recursive: true });
}

function localOrderPath(orderId: string): string {
  return path.join(ORDERS_DIR, `${orderId}.json`);
}

function readLocalOrder(orderId: string): Order | null {
  const filePath = localOrderPath(orderId);
  if (!fs.existsSync(filePath)) return null;
  return JSON.parse(fs.readFileSync(filePath, "utf8")) as Order;
}

function writeLocalOrder(order: Order): void {
  ensureOrdersDir();
  fs.writeFileSync(
    localOrderPath(order.id),
    `${JSON.stringify(order, null, 2)}\n`,
    "utf8"
  );
}

function deleteLocalOrder(orderId: string): void {
  const filePath = localOrderPath(orderId);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
}

function listLocalOrders(): Order[] {
  ensureOrdersDir();
  return fs
    .readdirSync(ORDERS_DIR)
    .filter((name) => name.endsWith(".json"))
    .map((name) =>
      JSON.parse(
        fs.readFileSync(path.join(ORDERS_DIR, name), "utf8")
      ) as Order
    );
}

function openOrdersCircuit(error: unknown, context: string): void {
  const wasOpen = isOrdersFirestoreDisabled();
  ordersCircuit.open();
  openGlobalFirestoreCircuit();
  if (!wasOpen) {
    logFirestoreWarning("orders", error, context);
  }
}

export function generateOrderId(date = new Date()): string {
  return formatOrderId(ORDER_ID_SEQUENCE_START, getOrderYear(date));
}

export async function persistOrder(order: Order): Promise<void> {
  if (isOrdersFirestoreDisabled()) {
    writeLocalOrder(order);
    return;
  }

  try {
    await tryFirestoreFast(
      () =>
        getAdminFirestore()
          .collection(COLLECTION)
          .doc(order.id)
          .set(sanitizeForFirestore(order)),
      {
        domain: "orders",
        context: "Persisting order locally — Firestore unavailable",
        fallback: (): WriteResult => {
          writeLocalOrder(order);
          return {} as WriteResult;
        },
      }
    );
  } catch (error) {
    if (isFirestoreUnavailableError(error)) {
      openOrdersCircuit(error, "Persisting order locally — Firestore unavailable");
      writeLocalOrder(order);
      return;
    }
    throw error;
  }
}

export async function fetchOrderById(orderId: string): Promise<Order | null> {
  if (!isOrdersFirestoreDisabled()) {
    try {
      const doc = await withFirestoreRetry(() =>
        getAdminFirestore()
          .collection(COLLECTION)
          .doc(orderId)
          .get()
      );
      if (doc.exists) {
        return { id: doc.id, ...doc.data() } as Order;
      }
    } catch (error) {
      if (isFirestoreUnavailableError(error)) {
        openOrdersCircuit(error, "Reading orders from local store");
      } else {
        throw error;
      }
    }
  }

  return readLocalOrder(orderId);
}

export async function updateOrder(
  orderId: string,
  patch: Partial<Order>
): Promise<Order> {
  const existing = await fetchOrderById(orderId);
  if (!existing) {
    throw new Error("Order not found");
  }

  const updated: Order = {
    ...existing,
    ...patch,
    id: orderId,
    updatedAt: patch.updatedAt ?? new Date().toISOString(),
  };

  if (!isOrdersFirestoreDisabled()) {
    try {
      await getAdminFirestore()
        .collection(COLLECTION)
        .doc(orderId)
        .update(sanitizeForFirestore(patch));
      return updated;
    } catch (error) {
      if (isFirestoreUnavailableError(error)) {
        openOrdersCircuit(error, "Updating order locally — Firestore unavailable");
      } else {
        throw error;
      }
    }
  }

  writeLocalOrder(updated);
  return updated;
}

export async function removeOrder(orderId: string): Promise<void> {
  deleteLocalOrder(orderId);

  if (isOrdersFirestoreDisabled()) {
    return;
  }

  try {
    await getAdminFirestore().collection(COLLECTION).doc(orderId).delete();
  } catch (error) {
    if (!isFirestoreUnavailableError(error)) {
      throw error;
    }
  }
}

export async function findOrderByRazorpayOrderId(
  razorpayOrderId: string
): Promise<Order | null> {
  if (!isOrdersFirestoreDisabled()) {
    try {
      const snap = await getAdminFirestore()
        .collection(COLLECTION)
        .where("razorpayOrderId", "==", razorpayOrderId)
        .limit(1)
        .get();

      if (!snap.empty) {
        const doc = snap.docs[0]!;
        return { id: doc.id, ...doc.data() } as Order;
      }
    } catch (error) {
      if (isFirestoreUnavailableError(error)) {
        openOrdersCircuit(error, "Searching local orders by Razorpay order id");
      } else {
        throw error;
      }
    }
  }

  return (
    listLocalOrders().find(
      (order) => order.razorpayOrderId === razorpayOrderId
    ) ?? null
  );
}

export async function findOrderByRazorpayPaymentId(
  razorpayPaymentId: string
): Promise<Order | null> {
  if (!isOrdersFirestoreDisabled()) {
    try {
      const snap = await getAdminFirestore()
        .collection(COLLECTION)
        .where("razorpayPaymentId", "==", razorpayPaymentId)
        .limit(1)
        .get();

      if (!snap.empty) {
        const doc = snap.docs[0]!;
        return { id: doc.id, ...doc.data() } as Order;
      }
    } catch (error) {
      if (isFirestoreUnavailableError(error)) {
        openOrdersCircuit(error, "Searching local orders by Razorpay payment id");
      } else {
        throw error;
      }
    }
  }

  return (
    listLocalOrders().find(
      (order) => order.razorpayPaymentId === razorpayPaymentId
    ) ?? null
  );
}

export async function listOrdersForUser(
  uid?: string,
  email?: string
): Promise<Order[]> {
  const byId = new Map<string, Order>();
  const normalizedEmail = email?.trim().toLowerCase();

  if (!isOrdersFirestoreDisabled()) {
    try {
      const db = getAdminFirestore();

      if (uid) {
        const snapshot = await db
          .collection(COLLECTION)
          .where("userId", "==", uid)
          .get();
        for (const doc of snapshot.docs) {
          byId.set(doc.id, { id: doc.id, ...doc.data() } as Order);
        }
      }

      const emailVariants = email
        ? Array.from(
            new Set([normalizedEmail, email.trim()].filter(Boolean) as string[])
          )
        : [];

      for (const variant of emailVariants) {
        const snapshot = await db
          .collection(COLLECTION)
          .where("email", "==", variant)
          .get();
        for (const doc of snapshot.docs) {
          if (!byId.has(doc.id)) {
            byId.set(doc.id, { id: doc.id, ...doc.data() } as Order);
          }
        }
      }
    } catch (error) {
      if (isFirestoreUnavailableError(error)) {
        openOrdersCircuit(error, "Listing orders from local store");
      } else {
        throw error;
      }
    }
  }

  for (const order of listLocalOrders()) {
    const matchesUser = uid ? order.userId === uid : false;
    const matchesEmail = normalizedEmail
      ? order.email?.toLowerCase() === normalizedEmail
      : false;
    if (matchesUser || matchesEmail) {
      byId.set(order.id, order);
    }
  }

  return Array.from(byId.values()).sort(
    (a, b) =>
      new Date(b.createdAt ?? 0).getTime() -
      new Date(a.createdAt ?? 0).getTime()
  );
}
