import "server-only";

import { randomUUID } from "node:crypto";
import { isPostgresConfigured, prisma } from "@/lib/db/prisma";
import { asJsonValue } from "@/lib/server/prisma/mappers";
import type {
  GiveawayCampaign,
  GiveawayEligibilityRules,
  GiveawayEntry,
  GiveawayFaq,
  GiveawaySocialClaim,
  GiveawaySocialPlatform,
  GiveawayWinner,
} from "@/types/giveaway";

function mapCampaign(
  row: {
    id: string;
    slug: string;
    title: string;
    subtitle: string;
    description: string;
    status: string;
    prizeTitle: string;
    prizeDescription: string;
    prizeImageUrl: string | null;
    productSlug: string | null;
    productName: string | null;
    prizeValue: number | null;
    winnerCount: number;
    maxEntries: number | null;
    startsAt: string;
    endsAt: string;
    drawAt: string | null;
    requireLogin: boolean;
    requireEmailVerification: boolean;
    referralBonusEntries: number;
    socialBonusEntries: number;
    allowedSocialPlatforms: unknown;
    eligibilityRules: unknown;
    termsHtml: string;
    faqs: unknown;
    featured: boolean;
    winnersAnnounced: boolean;
    createdAt: string;
    updatedAt: string;
    _count?: { entries: number };
  },
  entryCount?: number,
): GiveawayCampaign {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    subtitle: row.subtitle,
    description: row.description,
    status: row.status as GiveawayCampaign["status"],
    prizeTitle: row.prizeTitle,
    prizeDescription: row.prizeDescription,
    prizeImageUrl: row.prizeImageUrl,
    productSlug: row.productSlug,
    productName: row.productName,
    prizeValue: row.prizeValue,
    winnerCount: row.winnerCount,
    maxEntries: row.maxEntries,
    startsAt: row.startsAt,
    endsAt: row.endsAt,
    drawAt: row.drawAt,
    requireLogin: row.requireLogin,
    requireEmailVerification: row.requireEmailVerification,
    referralBonusEntries: row.referralBonusEntries,
    socialBonusEntries: row.socialBonusEntries,
    allowedSocialPlatforms: (row.allowedSocialPlatforms as GiveawaySocialPlatform[]) ?? [],
    eligibilityRules: (row.eligibilityRules as GiveawayEligibilityRules) ?? {},
    termsHtml: row.termsHtml,
    faqs: (row.faqs as GiveawayFaq[]) ?? [],
    featured: row.featured,
    winnersAnnounced: row.winnersAnnounced,
    entryCount: entryCount ?? row._count?.entries,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function mapEntry(row: {
  id: string;
  campaignId: string;
  entryNumber: string;
  userId: string | null;
  email: string;
  customerName: string;
  customerPhone: string;
  referralCode: string;
  referredByEntryId: string | null;
  socialClaims: unknown;
  baseEntries: number;
  bonusEntries: number;
  totalEntries: number;
  emailVerified: boolean;
  emailVerifiedAt: string | null;
  status: string;
  fraudFlags: unknown;
  trackingToken: string;
  createdAt: string;
  updatedAt: string;
  campaign?: {
    slug: string;
    title: string;
    prizeTitle: string;
    status: string;
    endsAt: string;
  };
}): GiveawayEntry {
  return {
    id: row.id,
    campaignId: row.campaignId,
    entryNumber: row.entryNumber,
    userId: row.userId,
    email: row.email,
    customerName: row.customerName,
    customerPhone: row.customerPhone,
    referralCode: row.referralCode,
    referredByEntryId: row.referredByEntryId,
    socialClaims: (row.socialClaims as GiveawaySocialClaim[]) ?? [],
    baseEntries: row.baseEntries,
    bonusEntries: row.bonusEntries,
    totalEntries: row.totalEntries,
    emailVerified: row.emailVerified,
    emailVerifiedAt: row.emailVerifiedAt,
    status: row.status as GiveawayEntry["status"],
    fraudFlags: (row.fraudFlags as string[]) ?? [],
    trackingToken: row.trackingToken,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    campaign: row.campaign
      ? {
          slug: row.campaign.slug,
          title: row.campaign.title,
          prizeTitle: row.campaign.prizeTitle,
          status: row.campaign.status as GiveawayCampaign["status"],
          endsAt: row.campaign.endsAt,
        }
      : undefined,
  };
}

function mapWinner(row: {
  id: string;
  campaignId: string;
  entryId: string;
  rank: number;
  announcedAt: string | null;
  notifiedAt: string | null;
  createdAt: string;
  entry?: { entryNumber: string; customerName: string; email: string };
}): GiveawayWinner {
  return {
    id: row.id,
    campaignId: row.campaignId,
    entryId: row.entryId,
    rank: row.rank,
    announcedAt: row.announcedAt,
    notifiedAt: row.notifiedAt,
    createdAt: row.createdAt,
    entry: row.entry,
  };
}

export async function listPublicGiveawayCampaigns(): Promise<GiveawayCampaign[]> {
  const rows = await prisma.giveawayCampaign.findMany({
    where: {
      status: { in: ["scheduled", "active", "ended", "drawn"] },
    },
    include: { _count: { select: { entries: true } } },
    orderBy: [{ featured: "desc" }, { startsAt: "desc" }],
  });
  return rows.map((row) => mapCampaign(row));
}

export async function getGiveawayCampaignBySlug(slug: string): Promise<GiveawayCampaign | null> {
  const row = await prisma.giveawayCampaign.findUnique({
    where: { slug },
    include: { _count: { select: { entries: true } } },
  });
  return row ? mapCampaign(row) : null;
}

export async function getGiveawayCampaignById(id: string): Promise<GiveawayCampaign | null> {
  const row = await prisma.giveawayCampaign.findUnique({
    where: { id },
    include: { _count: { select: { entries: true } } },
  });
  return row ? mapCampaign(row) : null;
}

export async function listAllGiveawayCampaigns(limit = 100): Promise<GiveawayCampaign[]> {
  const rows = await prisma.giveawayCampaign.findMany({
    include: { _count: { select: { entries: true } } },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
  return rows.map((row) => mapCampaign(row));
}

export async function upsertGiveawayCampaign(input: {
  id?: string;
  slug: string;
  title: string;
  subtitle?: string;
  description?: string;
  status?: string;
  prizeTitle: string;
  prizeDescription?: string;
  prizeImageUrl?: string | null;
  productSlug?: string | null;
  productName?: string | null;
  prizeValue?: number | null;
  winnerCount?: number;
  maxEntries?: number | null;
  startsAt: string;
  endsAt: string;
  drawAt?: string | null;
  requireLogin?: boolean;
  requireEmailVerification?: boolean;
  referralBonusEntries?: number;
  socialBonusEntries?: number;
  allowedSocialPlatforms?: GiveawaySocialPlatform[];
  eligibilityRules?: GiveawayEligibilityRules;
  termsHtml?: string;
  faqs?: GiveawayFaq[];
  featured?: boolean;
}): Promise<GiveawayCampaign> {
  const now = new Date().toISOString();
  const id = input.id ?? randomUUID();
  const row = await prisma.giveawayCampaign.upsert({
    where: { id },
    create: {
      id,
      slug: input.slug,
      title: input.title,
      subtitle: input.subtitle ?? "",
      description: input.description ?? "",
      status: input.status ?? "draft",
      prizeTitle: input.prizeTitle,
      prizeDescription: input.prizeDescription ?? "",
      prizeImageUrl: input.prizeImageUrl ?? null,
      productSlug: input.productSlug ?? null,
      productName: input.productName ?? null,
      prizeValue: input.prizeValue ?? null,
      winnerCount: input.winnerCount ?? 1,
      maxEntries: input.maxEntries ?? null,
      startsAt: input.startsAt,
      endsAt: input.endsAt,
      drawAt: input.drawAt ?? null,
      requireLogin: input.requireLogin ?? false,
      requireEmailVerification: input.requireEmailVerification ?? true,
      referralBonusEntries: input.referralBonusEntries ?? 1,
      socialBonusEntries: input.socialBonusEntries ?? 1,
      allowedSocialPlatforms: asJsonValue(
        input.allowedSocialPlatforms ?? ["instagram", "youtube", "facebook", "x"],
      ),
      eligibilityRules: asJsonValue(input.eligibilityRules ?? {}),
      termsHtml: input.termsHtml ?? "",
      faqs: asJsonValue(input.faqs ?? []),
      featured: input.featured ?? false,
      createdAt: now,
      updatedAt: now,
    },
    update: {
      slug: input.slug,
      title: input.title,
      subtitle: input.subtitle ?? "",
      description: input.description ?? "",
      status: input.status,
      prizeTitle: input.prizeTitle,
      prizeDescription: input.prizeDescription ?? "",
      prizeImageUrl: input.prizeImageUrl ?? null,
      productSlug: input.productSlug ?? null,
      productName: input.productName ?? null,
      prizeValue: input.prizeValue ?? null,
      winnerCount: input.winnerCount,
      maxEntries: input.maxEntries ?? null,
      startsAt: input.startsAt,
      endsAt: input.endsAt,
      drawAt: input.drawAt ?? null,
      requireLogin: input.requireLogin,
      requireEmailVerification: input.requireEmailVerification,
      referralBonusEntries: input.referralBonusEntries,
      socialBonusEntries: input.socialBonusEntries,
      allowedSocialPlatforms: asJsonValue(input.allowedSocialPlatforms),
      eligibilityRules: asJsonValue(input.eligibilityRules ?? {}),
      termsHtml: input.termsHtml ?? "",
      faqs: asJsonValue(input.faqs ?? []),
      featured: input.featured,
      updatedAt: now,
    },
    include: { _count: { select: { entries: true } } },
  });
  return mapCampaign(row);
}

export async function updateGiveawayCampaignFields(
  id: string,
  fields: Partial<{
    status: string;
    winnersAnnounced: boolean;
    updatedAt: string;
  }>,
): Promise<void> {
  await prisma.giveawayCampaign.update({
    where: { id },
    data: fields,
  });
}

export async function getNextGiveawayEntrySequence(): Promise<number> {
  const count = await prisma.giveawayEntry.count();
  return count + 1;
}

export async function findGiveawayEntryByEmail(
  campaignId: string,
  email: string,
): Promise<GiveawayEntry | null> {
  const row = await prisma.giveawayEntry.findUnique({
    where: { campaignId_email: { campaignId, email: email.toLowerCase() } },
  });
  return row ? mapEntry(row) : null;
}

export async function findGiveawayEntryByUser(
  campaignId: string,
  userId: string,
): Promise<GiveawayEntry | null> {
  const row = await prisma.giveawayEntry.findFirst({
    where: { campaignId, userId },
  });
  return row ? mapEntry(row) : null;
}

export async function countGiveawayEntriesByIp(
  campaignId: string,
  ipHash: string,
): Promise<number> {
  return prisma.giveawayEntry.count({
    where: { campaignId, ipHash },
  });
}

export async function findGiveawayEntryByReferralCode(
  referralCode: string,
): Promise<GiveawayEntry | null> {
  const row = await prisma.giveawayEntry.findUnique({
    where: { referralCode: referralCode.toUpperCase() },
  });
  return row ? mapEntry(row) : null;
}

export async function createGiveawayEntryRecord(input: {
  id: string;
  campaignId: string;
  entryNumber: string;
  userId?: string | null;
  email: string;
  customerName: string;
  customerPhone: string;
  referralCode: string;
  referredByEntryId?: string | null;
  baseEntries: number;
  bonusEntries: number;
  totalEntries: number;
  emailVerifyToken?: string | null;
  ipHash?: string | null;
  userAgentHash?: string | null;
  fraudFlags: string[];
  trackingToken: string;
  status: string;
}): Promise<GiveawayEntry> {
  const now = new Date().toISOString();
  const row = await prisma.giveawayEntry.create({
    data: {
      id: input.id,
      campaignId: input.campaignId,
      entryNumber: input.entryNumber,
      userId: input.userId ?? null,
      email: input.email.toLowerCase(),
      customerName: input.customerName,
      customerPhone: input.customerPhone,
      referralCode: input.referralCode,
      referredByEntryId: input.referredByEntryId ?? null,
      socialClaims: asJsonValue([]),
      baseEntries: input.baseEntries,
      bonusEntries: input.bonusEntries,
      totalEntries: input.totalEntries,
      emailVerifyToken: input.emailVerifyToken ?? null,
      ipHash: input.ipHash ?? null,
      userAgentHash: input.userAgentHash ?? null,
      fraudFlags: asJsonValue(input.fraudFlags),
      trackingToken: input.trackingToken,
      status: input.status,
      createdAt: now,
      updatedAt: now,
    },
  });
  return mapEntry(row);
}

export async function getGiveawayEntryById(id: string): Promise<GiveawayEntry | null> {
  const row = await prisma.giveawayEntry.findUnique({
    where: { id },
    include: {
      campaign: {
        select: { slug: true, title: true, prizeTitle: true, status: true, endsAt: true },
      },
    },
  });
  return row ? mapEntry(row) : null;
}

export async function getGiveawayEntryByTrackingToken(
  trackingToken: string,
): Promise<GiveawayEntry | null> {
  const row = await prisma.giveawayEntry.findUnique({
    where: { trackingToken },
    include: {
      campaign: {
        select: { slug: true, title: true, prizeTitle: true, status: true, endsAt: true },
      },
    },
  });
  return row ? mapEntry(row) : null;
}

export async function getGiveawayEntryByVerifyToken(token: string): Promise<GiveawayEntry | null> {
  const row = await prisma.giveawayEntry.findUnique({
    where: { emailVerifyToken: token },
    include: {
      campaign: {
        select: { slug: true, title: true, prizeTitle: true, status: true, endsAt: true },
      },
    },
  });
  return row ? mapEntry(row) : null;
}

export async function listGiveawayEntriesForCampaign(
  campaignId: string,
  limit = 500,
): Promise<GiveawayEntry[]> {
  const rows = await prisma.giveawayEntry.findMany({
    where: { campaignId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
  return rows.map(mapEntry);
}

export async function listGiveawayEntriesForUser(userId: string): Promise<GiveawayEntry[]> {
  if (!isPostgresConfigured()) return [];
  const rows = await prisma.giveawayEntry.findMany({
    where: { userId },
    include: {
      campaign: {
        select: { slug: true, title: true, prizeTitle: true, status: true, endsAt: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });
  return rows.map(mapEntry);
}

export async function updateGiveawayEntryFields(
  id: string,
  fields: Partial<{
    socialClaims: GiveawaySocialClaim[];
    bonusEntries: number;
    totalEntries: number;
    emailVerified: boolean;
    emailVerifiedAt: string | null;
    emailVerifyToken: string | null;
    status: string;
    updatedAt: string;
  }>,
): Promise<void> {
  await prisma.giveawayEntry.update({
    where: { id },
    data: {
      ...fields,
      socialClaims: fields.socialClaims ? asJsonValue(fields.socialClaims) : undefined,
    },
  });
}

export async function addReferralBonusToEntry(entryId: string, bonus: number): Promise<void> {
  const entry = await prisma.giveawayEntry.findUnique({ where: { id: entryId } });
  if (!entry) return;
  const bonusEntries = entry.bonusEntries + bonus;
  await prisma.giveawayEntry.update({
    where: { id: entryId },
    data: {
      bonusEntries,
      totalEntries: entry.baseEntries + bonusEntries,
      updatedAt: new Date().toISOString(),
    },
  });
}

export async function listGiveawayWinnersForCampaign(
  campaignId: string,
): Promise<GiveawayWinner[]> {
  const rows = await prisma.giveawayWinner.findMany({
    where: { campaignId },
    include: {
      entry: { select: { entryNumber: true, customerName: true, email: true } },
    },
    orderBy: { rank: "asc" },
  });
  return rows.map(mapWinner);
}

export async function createGiveawayWinners(
  campaignId: string,
  entryIds: string[],
): Promise<GiveawayWinner[]> {
  const now = new Date().toISOString();
  const winners = [];
  for (let i = 0; i < entryIds.length; i += 1) {
    const row = await prisma.giveawayWinner.create({
      data: {
        id: randomUUID(),
        campaignId,
        entryId: entryIds[i],
        rank: i + 1,
        createdAt: now,
      },
      include: {
        entry: { select: { entryNumber: true, customerName: true, email: true } },
      },
    });
    await prisma.giveawayEntry.update({
      where: { id: entryIds[i] },
      data: { status: "winner", updatedAt: now },
    });
    winners.push(mapWinner(row));
  }
  return winners;
}

export async function markGiveawayWinnersAnnounced(
  campaignId: string,
  winnerIds: string[],
): Promise<void> {
  const now = new Date().toISOString();
  await prisma.giveawayWinner.updateMany({
    where: { id: { in: winnerIds } },
    data: { announcedAt: now, notifiedAt: now },
  });
  await prisma.giveawayCampaign.update({
    where: { id: campaignId },
    data: { winnersAnnounced: true, status: "drawn", updatedAt: now },
  });
}

export async function appendGiveawayCampaignEvent(input: {
  campaignId: string;
  type: string;
  message?: string;
  metadata?: Record<string, unknown>;
  createdBy?: string;
}): Promise<void> {
  await prisma.giveawayCampaignEvent.create({
    data: {
      id: randomUUID(),
      campaignId: input.campaignId,
      type: input.type,
      message: input.message,
      metadata: asJsonValue(input.metadata ?? {}),
      createdBy: input.createdBy,
      createdAt: new Date().toISOString(),
    },
  });
}

export async function getGiveawayAnalyticsSummary() {
  const [campaigns, entries, verified, winners] = await Promise.all([
    prisma.giveawayCampaign.findMany({ select: { id: true, title: true, status: true } }),
    prisma.giveawayEntry.count(),
    prisma.giveawayEntry.count({ where: { emailVerified: true } }),
    prisma.giveawayWinner.count(),
  ]);

  const entryGroups = await prisma.giveawayEntry.groupBy({
    by: ["campaignId"],
    _count: { _all: true },
  });
  const titleById = new Map(campaigns.map((c) => [c.id, c.title]));

  return {
    totalCampaigns: campaigns.length,
    activeCampaigns: campaigns.filter((c) => c.status === "active").length,
    totalEntries: entries,
    verifiedEntries: verified,
    totalWinners: winners,
    entriesByCampaign: entryGroups
      .map((g) => ({
        campaignId: g.campaignId,
        title: titleById.get(g.campaignId) ?? g.campaignId,
        count: g._count._all,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10),
  };
}

export async function exportGiveawayEntriesCsv(campaignId: string): Promise<string> {
  const entries = await listGiveawayEntriesForCampaign(campaignId, 10000);
  const header = [
    "entryNumber",
    "email",
    "customerName",
    "customerPhone",
    "totalEntries",
    "emailVerified",
    "status",
    "referralCode",
    "fraudFlags",
    "createdAt",
  ].join(",");
  const lines = entries.map((e) =>
    [
      e.entryNumber,
      e.email,
      `"${e.customerName.replace(/"/g, '""')}"`,
      e.customerPhone,
      e.totalEntries,
      e.emailVerified,
      e.status,
      e.referralCode,
      `"${e.fraudFlags.join(";")}"`,
      e.createdAt,
    ].join(","),
  );
  return [header, ...lines].join("\n");
}

export async function deleteGiveawayCampaign(id: string): Promise<void> {
  await prisma.giveawayCampaign.delete({ where: { id } });
}

export async function listDrawEligibleEntries(campaignId: string): Promise<GiveawayEntry[]> {
  const rows = await prisma.giveawayEntry.findMany({
    where: { campaignId, status: "active" },
  });
  return rows.map(mapEntry);
}

export async function clearGiveawayWinners(campaignId: string): Promise<void> {
  await prisma.giveawayWinner.deleteMany({ where: { campaignId } });
}
