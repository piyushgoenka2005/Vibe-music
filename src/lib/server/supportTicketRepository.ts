import "server-only";

import { randomUUID } from "crypto";
import { prisma } from "@/lib/db/prisma";
import type {
  SupportTicket,
  SupportTicketCategory,
  SupportTicketPriority,
  SupportTicketStatus,
} from "@/types/supportTicket";

export const SUPPORT_TICKETS_COLLECTION = "supportTickets";

function mapSupportTicket(row: {
  id: string;
  userId: string | null;
  email: string;
  name: string;
  subject: string;
  message: string;
  category: string;
  orderId: string | null;
  status: string;
  priority: string;
  adminNote: string | null;
  assignedTo: string | null;
  createdAt: string;
  updatedAt: string;
  resolvedAt: string | null;
}): SupportTicket {
  return {
    id: row.id,
    userId: row.userId ?? undefined,
    email: row.email,
    name: row.name,
    subject: row.subject,
    message: row.message,
    category: row.category as SupportTicketCategory,
    orderId: row.orderId ?? undefined,
    status: row.status as SupportTicketStatus,
    priority: row.priority as SupportTicketPriority,
    adminNote: row.adminNote ?? undefined,
    assignedTo: row.assignedTo ?? undefined,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    resolvedAt: row.resolvedAt ?? undefined,
  };
}

export async function createSupportTicket(
  input: Omit<
    SupportTicket,
    "id" | "status" | "priority" | "createdAt" | "updatedAt"
  >
): Promise<SupportTicket> {
  const now = new Date().toISOString();
  const record: SupportTicket = {
    id: randomUUID(),
    ...input,
    email: input.email.trim().toLowerCase(),
    status: "open",
    priority: "normal",
    createdAt: now,
    updatedAt: now,
  };

  await prisma.supportTicket.create({
    data: {
      id: record.id,
      userId: record.userId ?? null,
      email: record.email,
      name: record.name,
      subject: record.subject,
      message: record.message,
      category: record.category,
      orderId: record.orderId ?? null,
      status: record.status,
      priority: record.priority,
      adminNote: record.adminNote ?? null,
      assignedTo: record.assignedTo ?? null,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      resolvedAt: record.resolvedAt ?? null,
    },
  });

  return record;
}

export async function getSupportTicketById(
  id: string
): Promise<SupportTicket | null> {
  const row = await prisma.supportTicket.findUnique({ where: { id } });
  return row ? mapSupportTicket(row) : null;
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

  const rows = await prisma.supportTicket.findMany({
    where: {
      ...(options.status ? { status: options.status } : {}),
      ...(options.userId ? { userId: options.userId } : {}),
      ...(options.email ? { email: options.email.toLowerCase() } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return rows.map(mapSupportTicket);
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
  const now = new Date().toISOString();
  const resolvedAt =
    patch.resolvedAt ??
    (patch.status === "resolved" || patch.status === "closed" ? now : undefined);

  await prisma.supportTicket.update({
    where: { id },
    data: {
      ...(patch.status !== undefined ? { status: patch.status } : {}),
      ...(patch.priority !== undefined ? { priority: patch.priority } : {}),
      ...(patch.adminNote !== undefined ? { adminNote: patch.adminNote } : {}),
      ...(patch.assignedTo !== undefined ? { assignedTo: patch.assignedTo } : {}),
      ...(resolvedAt !== undefined ? { resolvedAt } : {}),
      updatedAt: now,
    },
  });

  const ticket = await getSupportTicketById(id);
  if (!ticket) throw new Error("Ticket not found after update");
  return ticket;
}
