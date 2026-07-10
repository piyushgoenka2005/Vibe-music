import "server-only";

import { getAdminFirestore } from "@/lib/firebase/admin";
import type {
  SupportTicket,
  SupportTicketCategory,
  SupportTicketPriority,
  SupportTicketStatus,
} from "@/types/supportTicket";

export const SUPPORT_TICKETS_COLLECTION = "supportTickets";

function normalizeTicket(
  id: string,
  data: FirebaseFirestore.DocumentData
): SupportTicket {
  return {
    id,
    userId: data.userId ? String(data.userId) : undefined,
    email: String(data.email ?? ""),
    name: String(data.name ?? ""),
    subject: String(data.subject ?? ""),
    message: String(data.message ?? ""),
    category: (data.category as SupportTicketCategory) ?? "other",
    orderId: data.orderId ? String(data.orderId) : undefined,
    status: (data.status as SupportTicketStatus) ?? "open",
    priority: (data.priority as SupportTicketPriority) ?? "normal",
    adminNote: data.adminNote ? String(data.adminNote) : undefined,
    assignedTo: data.assignedTo ? String(data.assignedTo) : undefined,
    createdAt: String(data.createdAt ?? ""),
    updatedAt: String(data.updatedAt ?? ""),
    resolvedAt: data.resolvedAt ? String(data.resolvedAt) : undefined,
  };
}

export async function createSupportTicket(
  input: Omit<
    SupportTicket,
    "id" | "status" | "priority" | "createdAt" | "updatedAt"
  >
): Promise<SupportTicket> {
  const db = getAdminFirestore();
  const ref = db.collection(SUPPORT_TICKETS_COLLECTION).doc();
  const now = new Date().toISOString();
  const record: SupportTicket = {
    id: ref.id,
    ...input,
    status: "open",
    priority: "normal",
    createdAt: now,
    updatedAt: now,
  };
  await ref.set(record);
  return record;
}

export async function getSupportTicketById(
  id: string
): Promise<SupportTicket | null> {
  const db = getAdminFirestore();
  const doc = await db.collection(SUPPORT_TICKETS_COLLECTION).doc(id).get();
  if (!doc.exists) return null;
  return normalizeTicket(doc.id, doc.data()!);
}

export async function listSupportTickets(options: {
  status?: SupportTicketStatus;
  userId?: string;
  email?: string;
  limit?: number;
} = {}): Promise<SupportTicket[]> {
  const limit = Math.min(Math.max(options.limit ?? 50, 1), 100);

  if (options.userId && options.email) {
    const [byUser, byEmail] = await Promise.all([
      listSupportTickets({ userId: options.userId, status: options.status, limit }),
      listSupportTickets({
        email: options.email.toLowerCase(),
        status: options.status,
        limit,
      }),
    ]);
    const merged = new Map<string, SupportTicket>();
    for (const ticket of [...byUser, ...byEmail]) {
      merged.set(ticket.id, ticket);
    }
    return [...merged.values()]
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, limit);
  }

  const db = getAdminFirestore();
  let query: FirebaseFirestore.Query = db.collection(SUPPORT_TICKETS_COLLECTION);

  if (options.status) {
    query = query.where("status", "==", options.status);
  }
  if (options.userId) {
    query = query.where("userId", "==", options.userId);
  }
  if (options.email) {
    query = query.where("email", "==", options.email.toLowerCase());
  }

  const snap = await query.limit(limit).get();
  return snap.docs
    .map((doc) => normalizeTicket(doc.id, doc.data()))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function updateSupportTicket(
  id: string,
  patch: Partial<
    Pick<
      SupportTicket,
      | "status"
      | "priority"
      | "adminNote"
      | "assignedTo"
      | "resolvedAt"
    >
  >
): Promise<SupportTicket> {
  const db = getAdminFirestore();
  const now = new Date().toISOString();
  const update: Record<string, unknown> = { ...patch, updatedAt: now };

  if (patch.status === "resolved" || patch.status === "closed") {
    update.resolvedAt = now;
  }

  await db.collection(SUPPORT_TICKETS_COLLECTION).doc(id).update(update);
  const ticket = await getSupportTicketById(id);
  if (!ticket) throw new Error("Ticket not found after update");
  return ticket;
}
