import { getAdminFirestore } from "@/lib/firebase/admin";
import type { Order, OrderStatus } from "@/types/order";

export interface OrderTimelineEvent {
  id: string;
  status: OrderStatus;
  note?: string;
  actor: string;
  createdAt: string;
}

export async function listAllOrders(options: {
  status?: OrderStatus;
  search?: string;
  limit?: number;
  offset?: number;
} = {}): Promise<{ orders: Order[]; total: number }> {
  const db = getAdminFirestore();
  const snap = await db.collection("orders").orderBy("createdAt", "desc").get();

  let orders = snap.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Order[];

  if (options.status) {
    orders = orders.filter((o) => o.status === options.status);
  }

  if (options.search) {
    const q = options.search.toLowerCase();
    orders = orders.filter(
      (o) =>
        o.id.toLowerCase().includes(q) ||
        o.email.toLowerCase().includes(q) ||
        o.shippingAddress?.name?.toLowerCase().includes(q)
    );
  }

  const total = orders.length;
  const offset = options.offset ?? 0;
  const limit = options.limit ?? 20;
  orders = orders.slice(offset, offset + limit);

  return { orders, total };
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

  const now = new Date().toISOString();
  const timelineEvent: OrderTimelineEvent = {
    id: `${Date.now()}`,
    status,
    note,
    actor,
    createdAt: now,
  };

  const existingTimeline = (orderDoc.data()?.timeline as OrderTimelineEvent[]) ?? [];

  await orderRef.update({
    status,
    updatedAt: now,
    timeline: [...existingTimeline, timelineEvent],
  });

  const updated = await orderRef.get();
  return { id: updated.id, ...updated.data() } as Order;
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

export async function listCustomers(options: {
  search?: string;
  limit?: number;
  offset?: number;
} = {}) {
  const db = getAdminFirestore();
  const [usersSnap, ordersSnap] = await Promise.all([
    db.collection("users").get(),
    db.collection("orders").get(),
  ]);

  const orderStats = new Map<string, { count: number; spent: number }>();
  ordersSnap.docs.forEach((doc) => {
    const data = doc.data();
    const uid = data.userId as string | undefined;
    const email = String(data.email ?? "").toLowerCase();
    const key = uid ?? email;
    if (!key) return;
    const existing = orderStats.get(key) ?? { count: 0, spent: 0 };
    existing.count += 1;
    if (data.paymentStatus === "paid" || data.paymentStatus === "cod_pending") {
      existing.spent += Number(data.total ?? 0);
    }
    orderStats.set(key, existing);
  });

  let customers = usersSnap.docs.map((doc) => {
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

  customers.sort((a, b) => b.totalSpent - a.totalSpent);
  const total = customers.length;
  const offset = options.offset ?? 0;
  const limit = options.limit ?? 20;

  return {
    customers: customers.slice(offset, offset + limit),
    total,
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
