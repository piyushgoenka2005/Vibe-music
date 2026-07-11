import "server-only";

import { randomUUID } from "crypto";
import { prisma } from "@/lib/db/prisma";

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
  input: ContactMessageInput
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
