import "server-only";

import { createHash } from "crypto";
import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";

import { getAdminFirestore, isFirebaseAdminConfigured } from "@/lib/firebase/admin";
import { withFirestoreDeadline } from "@/lib/server/firestoreErrors";

const COLLECTION = "newsletter_subscribers";
const DATA_DIR = path.join(process.cwd(), ".data", "newsletter");
const SUBSCRIBERS_FILE = path.join(DATA_DIR, "subscribers.json");

export interface SubscriberRecord {
  email: string;
  firstName?: string;
  lastName?: string;
  marketing: boolean;
  subscribedAt: string;
  source: "website";
}

function emailDocId(email: string): string {
  return createHash("sha256").update(email).digest("hex").slice(0, 40);
}

async function ensureDataDir(): Promise<void> {
  await mkdir(DATA_DIR, { recursive: true });
}

async function readLocalSubscribers(): Promise<SubscriberRecord[]> {
  try {
    const raw = await readFile(SUBSCRIBERS_FILE, "utf8");
    const parsed = JSON.parse(raw) as SubscriberRecord[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writeLocalSubscribers(records: SubscriberRecord[]): Promise<void> {
  await ensureDataDir();
  await writeFile(SUBSCRIBERS_FILE, JSON.stringify(records, null, 2), "utf8");
}

async function subscribeWithFirestore(
  record: SubscriberRecord
): Promise<{ created: boolean }> {
  const db = getAdminFirestore();
  const ref = db.collection(COLLECTION).doc(emailDocId(record.email));
  const existing = await withFirestoreDeadline(() => ref.get());

  if (existing.exists) {
    return { created: false };
  }

  await withFirestoreDeadline(() => ref.set(record));
  return { created: true };
}

async function subscribeWithLocalFile(
  record: SubscriberRecord
): Promise<{ created: boolean }> {
  const subscribers = await readLocalSubscribers();
  const existing = subscribers.find((entry) => entry.email === record.email);

  if (existing) {
    return { created: false };
  }

  subscribers.push(record);
  await writeLocalSubscribers(subscribers);
  return { created: true };
}

export async function subscribeToNewsletter(input: {
  email: string;
  firstName?: string;
  lastName?: string;
  marketing?: boolean;
}): Promise<{ created: boolean }> {
  const email = input.email.trim().toLowerCase();
  const record: SubscriberRecord = {
    email,
    firstName: input.firstName?.trim() || undefined,
    lastName: input.lastName?.trim() || undefined,
    marketing: input.marketing ?? true,
    subscribedAt: new Date().toISOString(),
    source: "website",
  };

  if (isFirebaseAdminConfigured()) {
    try {
      return await subscribeWithFirestore(record);
    } catch (error) {
      console.error("[newsletter] Firestore subscribe failed, using local file:", error);
    }
  }

  return subscribeWithLocalFile(record);
}
