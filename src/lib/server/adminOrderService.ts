import { getAdminFirestore } from "@/lib/firebase/admin";
import { releaseOrderInventory } from "@/lib/server/inventoryService";
import { notifyOrderRefunded } from "@/lib/server/orderNotificationService";
import type { Order, OrderStatus } from "@/types/order";

export interface OrderTimelineEvent {
  id: string;
  status: OrderStatus;
  note?: string;
  actor: string;
  createdAt: string;
}

export interface PaginatedOrdersResult {
  orders: Order[];
  total?: number;
  hasMore: boolean;
  nextCursor?: string;
}

export interface PaginatedCustomersResult {
  customers: Array<{
    uid: string;
    email: string;
    displayName: string;
    isActive: boolean;
    orderCount: number;
    totalSpent: number;
    createdAt: string;
  }>;
  total?: number;
  hasMore: boolean;
  nextCursor?: string;
}

function docToOrder(doc: FirebaseFirestore.QueryDocumentSnapshot): Order {
  return { id: doc.id, ...doc.data() } as Order;
}

function matchesOrderSearch(order: Order, query: string): boolean {
  const q = query.toLowerCase();
  return (
    order.id.toLowerCase().includes(q) ||
    order.email.toLowerCase().includes(q) ||
    (order.shippingAddress?.name?.toLowerCase().includes(q) ?? false)
  );
}

export async function listAllOrders(
  options: {
    status?: OrderStatus;
    search?: string;
    limit?: number;
    offset?: number;
    cursor?: string;
  } = {}
): Promise<PaginatedOrdersResult> {
  const db = getAdminFirestore();
  const limit = Math.min(Math.max(options.limit ?? 20, 1), 100);
  const useLegacyOffset =
    !options.cursor && options.offset != null && options.offset > 0;

  let query: FirebaseFirestore.Query = db.collection("orders");

  if (options.status) {
    query = query.where("status", "==", options.status);
  }

  query = query.orderBy("createdAt", "desc");

  if (options.cursor) {
    const cursorDoc = await db.collection("orders").doc(options.cursor).get();
    if (cursorDoc.exists) {
      query = query.startAfter(cursorDoc);
    }
  }

  const fetchLimit = useLegacyOffset
    ? (options.offset ?? 0) + limit + 1
    : limit + 1;

  const snap = await query.limit(fetchLimit).get();
  let docs = snap.docs;

  if (useLegacyOffset) {
    docs = docs.slice(options.offset ?? 0);
  }

  const hasMore = docs.length > limit;
  const pageDocs = docs.slice(0, limit);
  let orders = pageDocs.map(docToOrder);

  if (options.search) {
    orders = orders.filter((order) => matchesOrderSearch(order, options.search!));
  }

  const nextCursor =
    hasMore && pageDocs.length > 0
      ? pageDocs[pageDocs.length - 1]!.id
      : undefined;

  const result: PaginatedOrdersResult = {
    orders,
    hasMore: options.search ? orders.length >= limit : hasMore,
    nextCursor,
  };

  if (!options.cursor && !options.search) {
    result.total = hasMore ? undefined : orders.length + (options.offset ?? 0);
  }

  return result;
}

export async function updateOrderStatus(
  orderId: string,
  status: OrderStatus,
  actor: string,
  note?: string
): Promise<Order> {
  const db = getAdminFirestore();
  const orderRef = db.collection("orders").doc(orderId);
  const orderDoc = await orderRef.get();
  if (!orderDoc.exists) throw new Error("Order not found");

  const existingOrder = { id: orderDoc.id, ...orderDoc.data() } as Order;

  if (status === "cancelled" && existingOrder.status !== "cancelled") {
    await releaseOrderInventory(existingOrder);
  }

  if (status === "refunded" && existingOrder.status !== "refunded") {
    await releaseOrderInventory(existingOrder);
  }

  const now = new Date().toISOString();
  const timelineEvent: OrderTimelineEvent = {
    id: `${Date.now()}`,
    status,
    note,
    actor,
    createdAt: now,
  };

  const existingTimeline = (orderDoc.data()?.timeline as OrderTimelineEvent[]) ?? [];

  const patch: Record<string, unknown> = {
    status,
    updatedAt: now,
    timeline: [...existingTimeline, timelineEvent],
  };

  if (status === "refunded" && existingOrder.paymentStatus !== "refunded") {
    patch.paymentStatus = "refunded";
    patch.refundedAt = now;
    patch.inventoryStatus = "released";
  }

  await orderRef.update(patch);

  const updated = await orderRef.get();
  const order = { id: updated.id, ...updated.data() } as Order;

  if (status === "refunded" && existingOrder.status !== "refunded") {
    void notifyOrderRefunded(order);
  }

  return order;
}

export async function addOrderNote(
  orderId: string,
  note: string,
  actor: string
): Promise<void> {
  const db = getAdminFirestore();
  const orderRef = db.collection("orders").doc(orderId);
  const orderDoc = await orderRef.get();
  if (!orderDoc.exists) throw new Error("Order not found");

  const notes = (orderDoc.data()?.notes as Array<{ text: string; actor: string; createdAt: string }>) ?? [];
  notes.push({ text: note, actor, createdAt: new Date().toISOString() });

  await orderRef.update({ notes, updatedAt: new Date().toISOString() });
}

async function fetchOrderStatsForUsers(
  userIds: string[]
): Promise<Map<string, { count: number; spent: number }>> {
  const stats = new Map<string, { count: number; spent: number }>();
  if (userIds.length === 0) return stats;

  const db = getAdminFirestore();
  const batches: string[][] = [];
  for (let i = 0; i < userIds.length; i += 10) {
    batches.push(userIds.slice(i, i + 10));
  }

  for (const batch of batches) {
    const snap = await db
      .collection("orders")
      .where("userId", "in", batch)
      .get();

    snap.docs.forEach((doc) => {
      const data = doc.data();
      const uid = String(data.userId ?? "");
      if (!uid) return;
      const existing = stats.get(uid) ?? { count: 0, spent: 0 };
      existing.count += 1;
      if (data.paymentStatus === "paid" || data.paymentStatus === "cod_pending") {
        existing.spent += Number(data.total ?? 0);
      }
      stats.set(uid, existing);
    });
  }

  return stats;
}

export async function listCustomers(
  options: {
    search?: string;
    limit?: number;
    offset?: number;
    cursor?: string;
  } = {}
): Promise<PaginatedCustomersResult> {
  const db = getAdminFirestore();
  const limit = Math.min(Math.max(options.limit ?? 20, 1), 100);
  const useLegacyOffset =
    !options.cursor && options.offset != null && options.offset > 0;

  let query: FirebaseFirestore.Query = db
    .collection("users")
    .orderBy("createdAt", "desc");

  if (options.cursor) {
    const cursorDoc = await db.collection("users").doc(options.cursor).get();
    if (cursorDoc.exists) {
      query = query.startAfter(cursorDoc);
    }
  }

  const fetchLimit = useLegacyOffset
    ? (options.offset ?? 0) + limit + 1
    : limit + 1;

  const snap = await query.limit(fetchLimit).get();
  let docs = snap.docs;

  if (useLegacyOffset) {
    docs = docs.slice(options.offset ?? 0);
  }

  const hasMore = docs.length > limit;
  const pageDocs = docs.slice(0, limit);
  const userIds = pageDocs.map((doc) => doc.id);
  const orderStats = await fetchOrderStatsForUsers(userIds);

  let customers = pageDocs.map((doc) => {
    const data = doc.data();
    const stats = orderStats.get(doc.id) ?? { count: 0, spent: 0 };
    return {
      uid: doc.id,
      email: String(data.email ?? ""),
      displayName: String(data.displayName ?? ""),
      isActive: data.isActive !== false,
      orderCount: stats.count,
      totalSpent: stats.spent,
      createdAt: String(data.createdAt ?? ""),
    };
  });

  if (options.search) {
    const q = options.search.toLowerCase();
    customers = customers.filter(
      (c) =>
        c.email.toLowerCase().includes(q) ||
        c.displayName.toLowerCase().includes(q)
    );
  }

  const nextCursor =
    hasMore && pageDocs.length > 0
      ? pageDocs[pageDocs.length - 1]!.id
      : undefined;

  return {
    customers,
    hasMore: options.search ? customers.length >= limit : hasMore,
    nextCursor,
    total: !options.cursor && !options.search ? undefined : undefined,
  };
}

export async function getCustomerDetail(uid: string) {
  const db = getAdminFirestore();
  const userDoc = await db.collection("users").doc(uid).get();
  if (!userDoc.exists) return null;

  const data = userDoc.data()!;
  const ordersSnap = await db
    .collection("orders")
    .where("userId", "==", uid)
    .orderBy("createdAt", "desc")
    .get()
    .catch(async () => {
      const all = await db.collection("orders").get();
      return {
        docs: all.docs.filter((d) => d.data().userId === uid),
      } as FirebaseFirestore.QuerySnapshot;
    });

  const orders = ordersSnap.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));

  return {
    uid,
    email: String(data.email ?? ""),
    displayName: String(data.displayName ?? ""),
    photoURL: data.photoURL ?? null,
    isActive: data.isActive !== false,
    createdAt: String(data.createdAt ?? ""),
    orders,
    orderCount: orders.length,
    totalSpent: orders.reduce((sum, o) => {
      const d = o as { paymentStatus?: string; total?: number };
      if (d.paymentStatus === "paid" || d.paymentStatus === "cod_pending") {
        return sum + (d.total ?? 0);
      }
      return sum;
    }, 0),
  };
}

export async function updateCustomerStatus(
  uid: string,
  isActive: boolean
): Promise<void> {
  const db = getAdminFirestore();
  await db.collection("users").doc(uid).update({
    isActive,
    updatedAt: new Date().toISOString(),
  });
}
