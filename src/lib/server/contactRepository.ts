import "server-only";

import { getAdminFirestore } from "@/lib/firebase/admin";

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
  const db = getAdminFirestore();
  const ref = db.collection(CONTACT_MESSAGES_COLLECTION).doc();
  const record: ContactMessageRecord = {
    id: ref.id,
    name: input.name.trim(),
    email: input.email.trim().toLowerCase(),
    phone: input.phone?.trim() || undefined,
    subject: input.subject.trim(),
    message: input.message.trim(),
    status: "new",
    createdAt: new Date().toISOString(),
  };
  await ref.set(record);
  return record;
}
