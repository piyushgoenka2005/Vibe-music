import Razorpay from "razorpay";
import { getAdminFirestore, isFirebaseAdminConfigured } from "@/lib/firebase/admin";
import { isDemoPaymentsAllowed, isRazorpayConfigured } from "@/lib/server/env";
import {
  isFirestoreFastFailError,
  isFirestoreUnavailableError,
  isGlobalFirestoreCircuitOpen,
  logFirestoreWarning,
  withFirestoreDeadline,
} from "@/lib/server/firestoreErrors";
import { withFirestoreRetry } from "@/lib/server/firestoreRetry";
import { sanitizeForFirestore } from "@/lib/server/firestoreSanitize";
import {
  verifyRazorpayPaymentSignature,
} from "@/lib/razorpay/signature";
import {
  calculateGST,
  DEFAULT_GST_RATE,
  getShippingCharge,
  SELLER_STATE,
  toPaise,
  type GSTRate,
} from "@/lib/gstCalculator";
import {
  reserveAndFulfillStockForOrder,
  reserveStockForOrder,
  releaseReservedStockForOrder,
} from "@/lib/server/inventoryService";
import { completeOrderPayment } from "@/lib/server/orderPaymentService";
import { allocateNextOrderId } from "@/lib/server/orderIdGenerator";
import {
  logPayment,
  logPaymentError,
  logRazorpayEnvPresence,
} from "@/lib/server/paymentDiagnostics";
import type { OrderInventoryLine } from "@/types/inventory";
import type {
  CreateOrderPayload,
  Order,
  PaymentMethod,
  PaymentStatus,
  VerifyPaymentPayload,
} from "@/types/order";

const PLATFORM_FEE = 0;

function getRazorpayInstance(): Razorpay {
  logRazorpayEnvPresence();

  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    throw new Error(
      "Missing Razorpay env vars: RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET"
    );
  }

  const instance = new Razorpay({ key_id: keyId, key_secret: keySecret });
  logPayment("Razorpay initialized");
  return instance;
}

function canUseDemoPayments(): boolean {
  return isDemoPaymentsAllowed() && !isRazorpayConfigured();
}

function extractRazorpayError(error: unknown): string | null {
  if (!error || typeof error !== "object") return null;
  const record = error as {
    error?: { description?: string; reason?: string };
    description?: string;
    message?: string;
  };
  return (
    record.error?.description ??
    record.error?.reason ??
    record.description ??
    record.message ??
    null
  );
}

function toInventoryLines(
  items: CreateOrderPayload["items"]
): OrderInventoryLine[] {
  return items.map((item) => ({
    productId: item.productId,
    variantId: item.variantId,
    quantity: item.quantity,
    name: item.name,
  }));
}

function buildOrderRecord(
  orderId: string,
  payload: CreateOrderPayload,
  userId?: string
): Omit<Order, "id"> {
  const subtotal = payload.items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const shippingCharge = getShippingCharge(subtotal, payload.couponDiscount);

  const invoice = calculateGST({
    items: payload.items.map((item) => ({
      productId: item.productId,
      name: item.name,
      quantity: item.quantity,
      unitPrice: item.price,
      gstRate: item.gstRate,
    })),
    couponDiscount: payload.couponDiscount,
    shippingCharge,
    platformFee: PLATFORM_FEE,
    sellerState: SELLER_STATE,
    buyerState: payload.buyerState,
  });

  const paymentStatus: PaymentStatus =
    payload.paymentMethod === "cod" ? "cod_pending" : "pending";

  const orderStatus = payload.paymentMethod === "cod" ? "processing" : "pending";

  const items = payload.items.map((source, index) => {
    const line = invoice.lineBreakdown[index]!;
    return {
      productId: source.productId,
      variantId: source.variantId,
      variantSku: source.variantSku,
      variantLabel: source.variantLabel,
      name: line.name,
      quantity: line.quantity,
      price: line.unitPrice,
      gstRate: line.gstRate as GSTRate,
      taxableAmount: line.taxableAmount,
      gstAmount: line.gstAmount,
      cgst: line.cgst,
      sgst: line.sgst,
      igst: line.igst,
    };
  });

  const now = new Date().toISOString();
  const customerName = payload.customerName?.trim() || payload.shippingAddress.name.trim();
  const customerPhone =
    payload.customerPhone?.trim() ||
    payload.shippingAddress.phone?.trim() ||
    undefined;

  return {
    userId,
    email: payload.email.trim().toLowerCase(),
    customerName,
    customerPhone,
    isGuestOrder: !userId,
    status: orderStatus,
    paymentStatus,
    paymentMethod: payload.paymentMethod,
    subtotal: invoice.subtotal,
    couponCode: payload.couponCode ?? null,
    couponDiscount: invoice.couponDiscount,
    shippingCharge: invoice.shippingCharge,
    platformFee: invoice.platformFee,
    totalGst: invoice.totalGst,
    cgst: invoice.totalCgst,
    sgst: invoice.totalSgst,
    igst: invoice.totalIgst,
    total: invoice.grandTotal,
    items,
    shippingAddress: payload.shippingAddress,
    invoice,
    inventoryStatus: "none",
    createdAt: now,
    updatedAt: now,
  };
}

export async function createOrder(
  payload: CreateOrderPayload,
  userId?: string
): Promise<{
  order: Order;
  razorpayOrderId?: string;
  keyId?: string;
  demoMode?: boolean;
}> {
  logPayment("Starting create order", {
    paymentMethod: payload.paymentMethod,
    itemCount: payload.items.length,
    firebaseConfigured: isFirebaseAdminConfigured(),
  });

  const db = getAdminFirestore();
  logPayment("Allocating order ID");
  const orderId = await allocateNextOrderId();
  logPayment("Order ID allocated", { orderId });

  const orderRef = db.collection("orders").doc(orderId);
  const orderData = buildOrderRecord(orderId, payload, userId);
  const inventoryLines = toInventoryLines(payload.items);

  const order: Order = { id: orderId, ...orderData };
  logPayment("Firestore write started", { orderId });
  await withFirestoreRetry(
    () => orderRef.set(sanitizeForFirestore(order)),
    { maxRetries: 3, baseDelayMs: 200 }
  );
  logPayment("Firestore write completed", { orderId });

  try {
    try {
      if (payload.paymentMethod === "cod") {
        logPayment("Inventory reservation started (COD)", { orderId });
        await reserveAndFulfillStockForOrder(orderId, inventoryLines);
        order.inventoryStatus = "fulfilled";
      } else {
        logPayment("Inventory reservation started (online)", { orderId });
        await reserveStockForOrder(orderId, inventoryLines);
        order.inventoryStatus = "reserved";
      }
      logPayment("Inventory reservation completed", { orderId });
    } catch (inventoryError) {
      if (isFirestoreUnavailableError(inventoryError)) {
        logFirestoreWarning(
          "orders",
          inventoryError,
          "Skipping inventory reservation — Firestore quota exceeded"
        );
        order.inventoryStatus = "none";
      } else {
        throw inventoryError;
      }
    }

    let razorpayOrderId: string | undefined;

    if (payload.paymentMethod === "razorpay") {
      if (isRazorpayConfigured()) {
        logPayment("Creating Razorpay order", { orderId, amountPaise: toPaise(order.total) });
        const razorpay = getRazorpayInstance();
        let razorpayOrder: { id: string };
        try {
          razorpayOrder = (await razorpay.orders.create({
            amount: toPaise(order.total),
            currency: "INR",
            receipt: orderId,
            notes: {
              email: payload.email,
              orderId,
            },
          })) as { id: string };
        } catch (razorpayError) {
          logPaymentError(razorpayError, { orderId, step: "razorpay.orders.create" });
          const description = extractRazorpayError(razorpayError);
          throw new Error(
            description
              ? `Razorpay: ${description}`
              : "Unable to create Razorpay payment order"
          );
        }
        razorpayOrderId = razorpayOrder.id;
        logPayment("Razorpay order created", { orderId, razorpayOrderId });
        await orderRef.update({
          razorpayOrderId,
          updatedAt: new Date().toISOString(),
        });
        order.razorpayOrderId = razorpayOrderId;
      } else if (!canUseDemoPayments()) {
        throw new Error(
          "Online payments are not configured. Add Razorpay keys to .env.local."
        );
      }
    }

    logPayment("Create order completed", { orderId, paymentMethod: payload.paymentMethod });
    return {
      order: { ...order, razorpayOrderId },
      razorpayOrderId,
      keyId: isRazorpayConfigured()
        ? process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ?? process.env.RAZORPAY_KEY_ID
        : undefined,
      demoMode:
        payload.paymentMethod === "razorpay" && canUseDemoPayments()
          ? true
          : undefined,
    };
  } catch (error) {
    logPaymentError(error, { orderId, step: "createOrder" });
    await releaseOrderReservation(orderId).catch(() => undefined);
    await orderRef.delete().catch(() => undefined);
    throw error;
  }
}

export function verifyRazorpaySignature(
  razorpayOrderId: string,
  razorpayPaymentId: string,
  razorpaySignature: string
): boolean {
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keySecret) {
    throw new Error("Missing RAZORPAY_KEY_SECRET");
  }

  return verifyRazorpayPaymentSignature(
    razorpayOrderId,
    razorpayPaymentId,
    razorpaySignature,
    keySecret
  );
}

export async function verifyAndCompletePayment(
  payload: VerifyPaymentPayload
): Promise<Order> {
  const isValid = verifyRazorpaySignature(
    payload.razorpayOrderId,
    payload.razorpayPaymentId,
    payload.razorpaySignature
  );

  if (!isValid) {
    throw new Error("Invalid payment signature");
  }

  const result = await completeOrderPayment({
    orderId: payload.orderId,
    razorpayPaymentId: payload.razorpayPaymentId,
    razorpayOrderId: payload.razorpayOrderId,
    source: "client_verify",
  });

  if (result.skipped) {
    return result.order;
  }

  const db = getAdminFirestore();
  await db.collection("orders").doc(payload.orderId).update({
    razorpaySignature: payload.razorpaySignature,
    updatedAt: new Date().toISOString(),
  });

  return {
    ...result.order,
    razorpaySignature: payload.razorpaySignature,
  };
}

export async function releaseOrderReservation(
  orderId: string,
  email?: string
): Promise<void> {
  const order = await getOrderById(orderId);
  if (!order) {
    throw new Error("Order not found");
  }

  if (email) {
    const normalized = email.trim().toLowerCase();
    if (order.email !== normalized) {
      throw new Error("Order email does not match");
    }
  }

  if (order.inventoryStatus !== "reserved") {
    return;
  }

  if (order.paymentStatus === "paid") {
    return;
  }

  const inventoryLines = toInventoryLines(order.items);
  await releaseReservedStockForOrder(orderId, inventoryLines);
}

export async function getOrderById(orderId: string): Promise<Order | null> {
  const db = getAdminFirestore();
  const doc = await db.collection("orders").doc(orderId).get();
  if (!doc.exists) return null;
  return { id: doc.id, ...doc.data() } as Order;
}

export async function listOrdersForUser(
  uid?: string,
  email?: string
): Promise<Order[]> {
  const db = getAdminFirestore();
  const byId = new Map<string, Order>();

  if (uid) {
    const snapshot = await db
      .collection("orders")
      .where("userId", "==", uid)
      .get();
    for (const doc of snapshot.docs) {
      byId.set(doc.id, { id: doc.id, ...doc.data() } as Order);
    }
  }

  const normalizedEmail = email?.trim().toLowerCase();
  const emailVariants = email
    ? Array.from(
        new Set([normalizedEmail, email.trim()].filter(Boolean) as string[])
      )
    : [];

  for (const variant of emailVariants) {
    const snapshot = await db
      .collection("orders")
      .where("email", "==", variant)
      .get();
    for (const doc of snapshot.docs) {
      if (!byId.has(doc.id)) {
        byId.set(doc.id, { id: doc.id, ...doc.data() } as Order);
      }
    }
  }

  return Array.from(byId.values()).sort(
    (a, b) =>
      new Date(b.createdAt ?? 0).getTime() -
      new Date(a.createdAt ?? 0).getTime()
  );
}

export function normalizeGstRate(rate: number | undefined): GSTRate {
  if (rate === 5 || rate === 12 || rate === 18 || rate === 28) return rate;
  return DEFAULT_GST_RATE;
}

export async function linkGuestOrdersToUser(
  userId: string,
  email: string
): Promise<number> {
  if (isGlobalFirestoreCircuitOpen()) {
    return 0;
  }

  try {
    const db = getAdminFirestore();
    const normalizedEmail = email.trim().toLowerCase();
    const snapshot = await withFirestoreDeadline(() =>
      db.collection("orders").where("email", "==", normalizedEmail).get()
    );

    if (snapshot.empty) return 0;

    const batch = db.batch();
    let linked = 0;
    const timestamp = new Date().toISOString();

    for (const doc of snapshot.docs) {
      const data = doc.data();
      if (!data.userId) {
        batch.update(doc.ref, {
          userId,
          isGuestOrder: false,
          updatedAt: timestamp,
        });
        linked += 1;
      }
    }

    if (linked > 0) {
      await batch.commit();
    }

    return linked;
  } catch (error) {
    if (
      isFirestoreUnavailableError(error) ||
      isFirestoreFastFailError(error)
    ) {
      logFirestoreWarning(
        "orders",
        error,
        "Unable to link guest orders — skipping"
      );
      return 0;
    }

    throw error;
  }
}

export type { PaymentMethod, PaymentStatus };
