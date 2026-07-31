import Razorpay from "razorpay";
import { cache } from "react";
import { isDemoPaymentsAllowed, isRazorpayConfigured } from "@/lib/server/env";
import {
  verifyRazorpayPaymentSignature,
} from "@/lib/razorpay/signature";
import {
  calculateGST,
  DEFAULT_GST_RATE,
  SELLER_STATE,
  toPaise,
  type GSTRate,
} from "@/lib/gstCalculator";
import {
  getDefaultShippingMethod,
} from "@/lib/shipping/shippingMethods";
import { notifyAdminNewOrder } from "@/lib/server/orderNotificationService";
import { resolveAuthoritativeShippingCharge } from "@/lib/server/shippingQuoteService";
import {
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
import {
  fetchOrderById,
  listOrdersForUser as listStoredOrdersForUser,
  persistOrder,
  removeOrder,
  updateOrder,
} from "@/lib/server/orderRepository";
import * as pgOrder from "@/lib/server/prisma/orderRepository";
import { isPlacedOrder } from "@/lib/server/orderAccess";
import { generateOrderTrackingToken } from "@/lib/server/orderTrackingToken";
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
  userId: string | undefined,
  shippingCharge: number
): Omit<Order, "id"> {
  const shippingMethod = payload.shippingMethod ?? getDefaultShippingMethod();

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

  const paymentStatus: PaymentStatus = "pending";

  const orderStatus = "pending";

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
    trackingToken: generateOrderTrackingToken(),
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
    shippingMethod,
    platformFee: invoice.platformFee,
    totalGst: invoice.totalGst,
    cgst: invoice.totalCgst,
    sgst: invoice.totalSgst,
    igst: invoice.totalIgst,
    total: invoice.grandTotal,
    items,
    shippingAddress: payload.shippingAddress,
    invoice: undefined,
    inventoryStatus: "none",
    createdAt: now,
    updatedAt: now,
  };
}

async function createRazorpayPaymentOrder(
  order: Order,
  payload: CreateOrderPayload,
  orderId: string
): Promise<string> {
  const razorpay = getRazorpayInstance();
  try {
    const razorpayOrder = (await razorpay.orders.create({
      amount: toPaise(order.total),
      currency: "INR",
      receipt: orderId,
      notes: {
        email: payload.email,
        orderId,
      },
    })) as { id: string };
    return razorpayOrder.id;
  } catch (razorpayError) {
    const description = extractRazorpayError(razorpayError);
    throw new Error(
      description
        ? `Razorpay: ${description}`
        : "Unable to create Razorpay payment order"
    );
  }
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
  });

  logPayment("Allocating order ID");
  const orderId = await allocateNextOrderId();
  logPayment("Order ID allocated", { orderId });

  const subtotal = payload.items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const shippingMethod = payload.shippingMethod ?? getDefaultShippingMethod();
  const shippingCharge = await resolveAuthoritativeShippingCharge({
    method: shippingMethod,
    subtotal,
    discount: payload.couponDiscount,
    postalCode: payload.shippingAddress.postalCode,
    state: payload.shippingAddress.state,
  });

  const orderData = buildOrderRecord(orderId, payload, userId, shippingCharge);
  const inventoryLines = toInventoryLines(payload.items);

  const order: Order = { id: orderId, ...orderData };
  let razorpayOrderId: string | undefined;
  let demoMode: boolean | undefined;
  let persisted = false;

  try {
    if (payload.paymentMethod === "razorpay") {
      if (isRazorpayConfigured()) {
        logPayment("Creating Razorpay order", { orderId, amountPaise: toPaise(order.total) });
        razorpayOrderId = await createRazorpayPaymentOrder(
          order,
          payload,
          orderId
        );
        logPayment("Razorpay order created", { orderId, razorpayOrderId });
        order.razorpayOrderId = razorpayOrderId;
      } else if (canUseDemoPayments()) {
        demoMode = true;
      } else {
        throw new Error(
          "Online payments are not configured. Add Razorpay keys to .env.local."
        );
      }
    }

    logPayment("Persisting order", { orderId });
    await persistOrder(order);
    persisted = true;
    logPayment("Order persisted", { orderId });
    void notifyAdminNewOrder(order);

    // Reserve inventory BEFORE returning checkout credentials (atomic vs payment race).
    try {
      logPayment("Inventory reservation started (online)", { orderId });
      await reserveStockForOrder(orderId, inventoryLines);
      await updateOrder(orderId, { inventoryStatus: "reserved" });
      logPayment("Inventory reservation completed", { orderId });
    } catch (inventoryError) {
      logPaymentError(inventoryError, {
        orderId,
        step: "inventoryReservation",
        paymentMethod: payload.paymentMethod,
      });
      await releaseOrderReservation(orderId).catch(() => undefined);
      await removeOrder(orderId).catch(() => undefined);
      persisted = false;
      throw inventoryError instanceof Error
        ? inventoryError
        : new Error("Unable to reserve inventory for this order.");
    }

    logPayment("Create order completed", { orderId, paymentMethod: payload.paymentMethod });
    return {
      order: { ...order, razorpayOrderId, inventoryStatus: "reserved" },
      razorpayOrderId,
      keyId: isRazorpayConfigured()
        ? process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ?? process.env.RAZORPAY_KEY_ID
        : undefined,
      demoMode:
        payload.paymentMethod === "razorpay" && canUseDemoPayments()
          ? true
          : demoMode,
    };
  } catch (error) {
    logPaymentError(error, { orderId, step: "createOrder" });
    if (persisted) {
      await releaseOrderReservation(orderId).catch(() => undefined);
      await removeOrder(orderId).catch(() => undefined);
    }
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

  await updateOrder(payload.orderId, {
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
  const order = await fetchOrderById(orderId);
  if (!order) {
    return;
  }

  if (email) {
    const normalized = email.trim().toLowerCase();
    if (order.email !== normalized) {
      return;
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

export const getOrderById = cache(async (orderId: string): Promise<Order | null> => {
  return fetchOrderById(orderId);
});

export async function listOrdersForUser(
  uid?: string,
  email?: string
): Promise<Order[]> {
  const orders = await listStoredOrdersForUser(uid, email);
  return orders.filter(isPlacedOrder);
}

export function normalizeGstRate(rate: number | undefined): GSTRate {
  if (rate === 5 || rate === 12 || rate === 18 || rate === 28) return rate;
  return DEFAULT_GST_RATE;
}

export async function linkGuestOrdersToUser(
  userId: string,
  email: string
): Promise<number> {
  // Intentionally disabled: bulk email linking is an IDOR vector.
  // Use attachPaidOrderToUser for cryptographically verified checkout ownership.
  void userId;
  void email;
  return 0;
}

/**
 * Attach a single guest order to a user only when the order email matches
 * the authenticated account email (case-insensitive). Used after payment verify.
 */
export async function attachPaidOrderToUser(
  orderId: string,
  userId: string,
  email: string
): Promise<boolean> {
  return pgOrder.attachPaidOrderToUser(orderId, userId, email);
}

export type { PaymentMethod, PaymentStatus };
