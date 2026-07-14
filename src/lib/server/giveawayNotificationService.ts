import "server-only";

import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/db/prisma";
import type { GiveawayCampaign, GiveawayEntry } from "@/types/giveaway";
import { logInfo } from "@/lib/server/logger";

export async function notifyGiveawayUpdate(
  entry: GiveawayEntry,
  campaign: GiveawayCampaign,
  event: "entry" | "verified" | "winner"
): Promise<void> {
  const title =
    event === "winner"
      ? "Giveaway winner!"
      : event === "verified"
        ? "Giveaway entry verified"
        : "Giveaway entry received";
  const body = `${campaign.title} — ${entry.entryNumber}`;

  try {
    if (entry.userId) {
      await prisma.userNotification.create({
        data: {
          id: randomUUID(),
          userId: entry.userId,
          type: "giveaway",
          title,
          body,
          link: `/account/giveaways`,
          read: false,
          createdAt: new Date().toISOString(),
        },
      });
    }
    await prisma.adminNotification.create({
      data: {
        id: randomUUID(),
        type: "giveaway",
        title,
        body,
        link: `/admin/giveaway/campaigns/${campaign.id}`,
        read: false,
        createdAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    logInfo("Giveaway notification failed", "giveaway-notify", {
      entryId: entry.id,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
