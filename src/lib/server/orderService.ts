import Razorpay from "razorpay";
import crypto from "crypto";
import { getAdminFirestore } from "@/lib/firebase/admin";
import {
  calculateGST,
  DEFAULT_GST_RATE,
  getShippingCharge,
  SELLER_STATE,
  toPaise,
  type GSTRate,
} from "@/lib/gstCalculator";
import type {
  CreateOrderPayload,
  Order,
  PaymentMethod,
  PaymentStatus,
  VerifyPaymentPayload,
} from "@/types/order";

const PLATFORM_FEE = 0;

function getRazorpayInstance(): Razorpay {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    throw new Error(
      "Missing Razorpay env vars: RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET"
    );
  }

  return new Razorpay({ key_id: keyId, key_secret: keySecret });
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

  const items = invoice.lineBreakdown.map((line) => ({
    productId: line.productId,
    name: line.name,
    quantity: line.quantity,
    price: line.unitPrice,
    gstRate: line.gstRate as GSTRate,
    taxableAmount: line.taxableAmount,
    gstAmount: line.gstAmount,
    cgst: line.cgst,
    sgst: line.sgst,
    igst: line.igst,
  }));

  const now = new Date().toISOString();

  return {
    userId,
    email: payload.email.trim().toLowerCase(),
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
    createdAt: now,
    updatedAt: now,
  };
}

export async function createOrder(
  payload: CreateOrderPayload,
  userId?: string
): Promise<{ order: Order; razorpayOrderId?: string; keyId?: string }> {
  const db = getAdminFirestore();
  const orderRef = db.collection("orders").doc();
  const orderId = orderRef.id;
  const orderData = buildOrderRecord(orderId, payload, userId);

  let razorpayOrderId: string | undefined;

  if (payload.paymentMethod === "razorpay") {
    const razorpay = getRazorpayInstance();
    const razorpayOrder = await razorpay.orders.create({
      amount: toPaise(orderData.total),
      currency: "INR",
      receipt: orderId,
      notes: {
        email: payload.email,
        orderId,
      },
    });
    razorpayOrderId = razorpayOrder.id;
    orderData.razorpayOrderId = razorpayOrderId;
  }

  const order: Order = { id: orderId, ...orderData };
  await orderRef.set(order);

  return {
    order,
    razorpayOrderId,
    keyId:
      process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ?? process.env.RAZORPAY_KEY_ID,
  };
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

  const body = `${razorpayOrderId}|${razorpayPaymentId}`;
  const expected = crypto
    .createHmac("sha256", keySecret)
    .update(body)
    .digest("hex");

  return expected === razorpaySignature;
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

  const db = getAdminFirestore();
  const orderRef = db.collection("orders").doc(payload.orderId);
  const doc = await orderRef.get();

  if (!doc.exists) {
    throw new Error("Order not found");
  }

  const order = { id: doc.id, ...doc.data() } as Order;

  if (order.razorpayOrderId !== payload.razorpayOrderId) {
    throw new Error("Razorpay order mismatch");
  }

  const now = new Date().toISOString();
  const updated: Partial<Order> = {
    paymentStatus: "paid",
    status: "processing",
    razorpayPaymentId: payload.razorpayPaymentId,
    razorpaySignature: payload.razorpaySignature,
    updatedAt: now,
  };

  await orderRef.update(updated);

  return { ...order, ...updated };
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

export type { PaymentMethod, PaymentStatus };
