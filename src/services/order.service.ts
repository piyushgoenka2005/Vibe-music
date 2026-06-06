import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
  type Timestamp,
} from "firebase/firestore";
import { getClientFirestore } from "@/lib/firebase/client";
import type { CreateOrderInput, Order, OrderStatus } from "@/types/order";

const ORDERS = "orders";

function toIso(value: Timestamp | string | undefined): string {
  if (!value) return new Date().toISOString();
  if (typeof value === "string") return value;
  return value.toDate().toISOString();
}

function mapOrder(id: string, data: Record<string, unknown>): Order {
  return {
    id,
    userId: (data.userId as string | null) ?? null,
    email: String(data.email ?? ""),
    items: (data.items as Order["items"]) ?? [],
    shipping: data.shipping as Order["shipping"],
    subtotal: Number(data.subtotal ?? 0),
    discount: Number(data.discount ?? 0),
    total: Number(data.total ?? 0),
    couponCode: (data.couponCode as string | null) ?? null,
    status: (data.status as OrderStatus) ?? "pending",
    paymentProvider: (data.paymentProvider as Order["paymentProvider"]) ?? "demo",
    paymentId: (data.paymentId as string | null) ?? null,
    createdAt: toIso(data.createdAt as Timestamp | string | undefined),
    updatedAt: toIso(data.updatedAt as Timestamp | string | undefined),
  };
}

export async function createOrder(input: CreateOrderInput): Promise<Order> {
  const db = getClientFirestore();
  const payload = {
    userId: input.userId,
    email: input.email,
    items: input.items.map((item) => ({
      productId: item.productId,
      slug: item.slug,
      name: item.name,
      brand: item.brand,
      price: item.price,
      quantity: item.quantity,
    })),
    shipping: input.shipping,
    subtotal: input.subtotal,
    discount: input.discount,
    total: input.total,
    couponCode: input.couponCode,
    status: "pending" as OrderStatus,
    paymentProvider: "razorpay" as const,
    paymentId: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const ref = await addDoc(collection(db, ORDERS), payload);
  return mapOrder(ref.id, { ...payload, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
}

export async function updateOrderStatus(
  orderId: string,
  status: OrderStatus,
  paymentId?: string
): Promise<void> {
  const db = getClientFirestore();
  await updateDoc(doc(db, ORDERS, orderId), {
    status,
    ...(paymentId ? { paymentId } : {}),
    updatedAt: serverTimestamp(),
  });
}

export async function getOrdersForUser(userId: string): Promise<Order[]> {
  const db = getClientFirestore();
  const q = query(
    collection(db, ORDERS),
    where("userId", "==", userId),
    orderBy("createdAt", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => mapOrder(d.id, d.data() as Record<string, unknown>));
}

export async function getOrderById(orderId: string): Promise<Order | null> {
  const db = getClientFirestore();
  const snap = await getDoc(doc(db, ORDERS, orderId));
  if (!snap.exists()) return null;
  return mapOrder(snap.id, snap.data() as Record<string, unknown>);
}

export async function trackOrder(orderId: string, email: string): Promise<Order | null> {
  const order = await getOrderById(orderId);
  if (!order) return null;
  if (order.email.toLowerCase() !== email.trim().toLowerCase()) return null;
  return order;
}
