import "server-only";

import { randomUUID } from "crypto";
import { prisma } from "@/lib/db/prisma";

export interface SubscriberRecord {
  email: string;
  firstName?: string;
  lastName?: string;
  marketing: boolean;
  subscribedAt: string;
  source: "website";
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

  const existing = await prisma.newsletterSubscriber.findUnique({
    where: { email },
  });
  if (existing) {
    if (existing.marketing !== record.marketing) {
      await prisma.newsletterSubscriber.update({
        where: { email },
        data: { marketing: record.marketing },
      });
    }
    return { created: false };
  }

  await prisma.newsletterSubscriber.create({
    data: {
      id: randomUUID(),
      email: record.email,
      firstName: record.firstName ?? null,
      lastName: record.lastName ?? null,
      marketing: record.marketing,
      subscribedAt: record.subscribedAt,
      source: record.source,
    },
  });

  return { created: true };
}

/** Sync account newsletter/promotions prefs to the subscriber table. */
export async function syncNewsletterMarketingPreference(input: {
  email: string;
  marketing: boolean;
  firstName?: string | null;
}): Promise<void> {
  const email = input.email.trim().toLowerCase();
  if (!email) return;

  const existing = await prisma.newsletterSubscriber.findUnique({
    where: { email },
  });

  if (existing) {
    if (existing.marketing !== input.marketing) {
      await prisma.newsletterSubscriber.update({
        where: { email },
        data: { marketing: input.marketing },
      });
    }
    return;
  }

  if (!input.marketing) return;

  await prisma.newsletterSubscriber.create({
    data: {
      id: randomUUID(),
      email,
      firstName: input.firstName?.trim() || null,
      lastName: null,
      marketing: true,
      subscribedAt: new Date().toISOString(),
      source: "website",
    },
  });
}
