import "server-only";

import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";

const DATA_DIR = path.join(process.cwd(), ".data", "newsletter");
const SUBSCRIBERS_FILE = path.join(DATA_DIR, "subscribers.json");

interface SubscriberRecord {
  email: string;
  firstName?: string;
  lastName?: string;
  marketing: boolean;
  subscribedAt: string;
}

async function ensureDataDir(): Promise<void> {
  await mkdir(DATA_DIR, { recursive: true });
}

async function readSubscribers(): Promise<SubscriberRecord[]> {
  try {
    const raw = await readFile(SUBSCRIBERS_FILE, "utf8");
    const parsed = JSON.parse(raw) as SubscriberRecord[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writeSubscribers(records: SubscriberRecord[]): Promise<void> {
  await ensureDataDir();
  await writeFile(SUBSCRIBERS_FILE, JSON.stringify(records, null, 2), "utf8");
}

export async function subscribeToNewsletter(input: {
  email: string;
  firstName?: string;
  lastName?: string;
  marketing?: boolean;
}): Promise<{ created: boolean }> {
  const email = input.email.trim().toLowerCase();
  const subscribers = await readSubscribers();
  const existing = subscribers.find((entry) => entry.email === email);

  if (existing) {
    return { created: false };
  }

  subscribers.push({
    email,
    firstName: input.firstName?.trim() || undefined,
    lastName: input.lastName?.trim() || undefined,
    marketing: input.marketing ?? true,
    subscribedAt: new Date().toISOString(),
  });

  await writeSubscribers(subscribers);
  return { created: true };
}
