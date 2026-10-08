import "server-only";

import { randomUUID } from "crypto";
import { prisma } from "@/lib/db/prisma";
import { clampPageLimit, pageFromRows } from "@/lib/server/prisma/pagination";

export const CONTACT_MESSAGES_COLLECTION = "contactMessages";

export interface ContactMessageInput {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
}

export interface ContactMessageRecord extends ContactMessageInput {
  id: string;
  status: "new" | "read";
  createdAt: string;
}

export async function createContactMessage(
  input: ContactMessageInput,
): Promise<ContactMessageRecord> {
  const record: ContactMessageRecord = {
    id: randomUUID(),
    name: input.name.trim(),
    email: input.email.trim().toLowerCase(),
    phone: input.phone?.trim() || undefined,
    subject: input.subject.trim(),
    message: input.message.trim(),
    status: "new",
    createdAt: new Date().toISOString(),
  };

  await prisma.contactMessage.create({
    data: {
      id: record.id,
      name: record.name,
      email: record.email,
      phone: record.phone ?? null,
      subject: record.subject,
      message: record.message,
      status: record.status,
      createdAt: record.createdAt,
    },
  });

  return record;
}

export async function listContactMessages(options?: {
  status?: "new" | "read";
  limit?: number;
}): Promise<ContactMessageRecord[]> {
  const limit = Math.min(Math.max(options?.limit ?? 50, 1), 200);
  const rows = await prisma.contactMessage.findMany({
    where: options?.status ? { status: options.status } : undefined,
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone ?? undefined,
    subject: row.subject,
    message: row.message,
    status: row.status === "read" ? "read" : "new",
    createdAt: row.createdAt,
  }));
}

export async function listContactMessagesPage(options?: {
  status?: "new" | "read";
  limit?: number;
  afterCreatedAt?: string;
}): Promise<{
  messages: ContactMessageRecord[];
  hasMore: boolean;
  nextCursor?: string;
  total: number;
}> {
  const limit = clampPageLimit(options?.limit);
  const where = {
    ...(options?.status ? { status: options.status } : {}),
    ...(options?.afterCreatedAt ? { createdAt: { lt: options.afterCreatedAt } } : {}),
  };

  const [rows, total] = await Promise.all([
    prisma.contactMessage.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit + 1,
    }),
    prisma.contactMessage.count({
      where: options?.status ? { status: options.status } : undefined,
    }),
  ]);

  const page = pageFromRows(rows, limit, (row) => row.createdAt);
  return {
    messages: page.items.map((row) => ({
      id: row.id,
      name: row.name,
      email: row.email,
      phone: row.phone ?? undefined,
      subject: row.subject,
      message: row.message,
      status: row.status === "read" ? "read" : "new",
      createdAt: row.createdAt,
    })),
    hasMore: page.hasMore,
    nextCursor: page.nextCursor,
    total,
  };
}

export async function updateContactMessageStatus(
  id: string,
  status: "new" | "read",
): Promise<ContactMessageRecord | null> {
  try {
    const row = await prisma.contactMessage.update({
      where: { id },
      data: { status },
    });
    return {
      id: row.id,
      name: row.name,
      email: row.email,
      phone: row.phone ?? undefined,
      subject: row.subject,
      message: row.message,
      status: row.status === "read" ? "read" : "new",
      createdAt: row.createdAt,
    };
  } catch {
    return null;
  }
}
