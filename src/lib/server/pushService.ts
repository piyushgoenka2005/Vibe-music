import "server-only";

import { randomUUID } from "crypto";
import webpush from "web-push";
import { prisma } from "@/lib/db/prisma";

/**
 * Web-push delivery (master program Phase 9). Inert until VAPID keys are set:
 *   NEXT_PUBLIC_VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY / VAPID_SUBJECT
 * Generate with: node scripts/ops/generate-vapid-keys.mjs
 */

const PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim() ?? "";
const PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY?.trim() ?? "";
const SUBJECT =
  process.env.VAPID_SUBJECT?.trim() ?? "mailto:support@vibemusic.in";

let configured = false;
try {
  if (PUBLIC_KEY && PRIVATE_KEY) {
    webpush.setVapidDetails(SUBJECT, PUBLIC_KEY, PRIVATE_KEY);
    configured = true;
  }
} catch {
  configured = false;
}

export function isPushConfigured(): boolean {
  return configured;
}

export function getVapidPublicKey(): string {
  return PUBLIC_KEY;
}

export interface SaveSubscriptionInput {
  userId: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  userAgent?: string | null;
}

export async function saveSubscription(input: SaveSubscriptionInput): Promise<void> {
  if (!configured) throw new Error("Push not configured");
  if (!input.endpoint.startsWith("https://")) throw new Error("Invalid endpoint");

  await prisma.pushSubscription.upsert({
    where: { endpoint: input.endpoint },
    create: {
      id: randomUUID(),
      userId: input.userId,
      endpoint: input.endpoint,
      p256dh: input.p256dh,
      auth: input.auth,
      userAgent: input.userAgent ?? null,
      createdAt: new Date().toISOString(),
    },
    update: {
      userId: input.userId,
      p256dh: input.p256dh,
      auth: input.auth,
      userAgent: input.userAgent ?? null,
    },
  });
}

export async function removeSubscription(
  userId: string,
  endpoint: string
): Promise<void> {
  await prisma.pushSubscription.deleteMany({
    where: { endpoint, userId },
  });
}

async function deleteByEndpoint(endpoint: string): Promise<void> {
  await prisma.pushSubscription.deleteMany({ where: { endpoint } }).catch(() => undefined);
}

/** Push payload contract consumed by public/sw.js */
export interface PushPayload {
  title: string;
  body: string;
  url: string;
  tag?: string;
}

/**
 * Send to every device of a user. Dead endpoints (404/410) are pruned
 * automatically so the table stays clean without a sweeper.
 */
export async function sendPushToUser(
  userId: string,
  payload: PushPayload
): Promise<{ sent: number; pruned: number }> {
  if (!configured) return { sent: 0, pruned: 0 };

  const subs = await prisma.pushSubscription.findMany({ where: { userId } });
  let sent = 0;
  let pruned = 0;

  await Promise.all(
    subs.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          JSON.stringify(payload),
          { TTL: 60 * 60 * 24 }
        );
        sent += 1;
      } catch (error) {
        const status =
          typeof error === "object" && error && "statusCode" in error
            ? Number((error as { statusCode?: number }).statusCode)
            : 0;
        if (status === 404 || status === 410) {
          await deleteByEndpoint(sub.endpoint);
          pruned += 1;
        }
      }
    })
  );

  return { sent, pruned };
}
