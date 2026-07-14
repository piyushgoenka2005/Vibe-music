import "server-only";

import { randomUUID } from "node:crypto";
import { evaluateGiveawayEligibility } from "@/lib/giveaway/eligibilityEngine";
import { buildDrawPool, runWeightedDraw } from "@/lib/giveaway/drawEngine";
import {
  detectGiveawayFraud,
  generateEntryNumber,
  generateReferralCode,
  generateTrackingToken,
  generateVerifyToken,
  hashClientFingerprint,
  shouldBlockEntry,
} from "@/lib/giveaway/fraudEngine";
import { logAuditEvent } from "@/lib/server/auditLog";
import {
  addReferralBonusToEntry,
  appendGiveawayCampaignEvent,
  clearGiveawayWinners,
  createGiveawayEntryRecord,
  createGiveawayWinners,
  exportGiveawayEntriesCsv,
  findGiveawayEntryByReferralCode,
  findGiveawayEntryByEmail,
  findGiveawayEntryByUser,
  countGiveawayEntriesByIp,
  getGiveawayCampaignById,
  getGiveawayCampaignBySlug,
  getGiveawayEntryById,
  getGiveawayEntryByTrackingToken,
  getGiveawayEntryByVerifyToken,
  getNextGiveawayEntrySequence,
  listDrawEligibleEntries,
  listGiveawayWinnersForCampaign,
  markGiveawayWinnersAnnounced,
  updateGiveawayCampaignFields,
  updateGiveawayEntryFields,
  upsertGiveawayCampaign,
} from "@/lib/server/giveawayRepository";
import { sendGiveawayEmail } from "@/lib/server/giveawayEmailService";
import { notifyGiveawayUpdate } from "@/lib/server/giveawayNotificationService";
import type {
  CreateGiveawayEntryPayload,
  GiveawayCampaign,
  GiveawaySocialPlatform,
} from "@/types/giveaway";

export async function submitGiveawayEntry(
  payload: CreateGiveawayEntryPayload,
  context: {
    userId?: string;
    ip?: string | null;
    userAgent?: string | null;
    request?: Request;
  }
) {
  const campaign = await getGiveawayCampaignBySlug(payload.campaignSlug);
  if (!campaign) throw new Error("Giveaway not found");

  const eligibility = evaluateGiveawayEligibility({
    campaign,
    email: payload.email,
    customerPhone: payload.customerPhone,
    ageConfirmed: payload.ageConfirmed,
    isLoggedIn: Boolean(context.userId),
  });
  if (!eligibility.eligible) {
    throw new Error(eligibility.reasons[0] ?? "Not eligible");
  }

  const { ipHash, userAgentHash } = hashClientFingerprint(context.ip, context.userAgent);
  const existingByEmail = Boolean(
    await findGiveawayEntryByEmail(campaign.id, payload.email)
  );
  const existingByUser = context.userId
    ? Boolean(await findGiveawayEntryByUser(campaign.id, context.userId))
    : false;
  const ipEntryCount = ipHash
    ? await countGiveawayEntriesByIp(campaign.id, ipHash)
    : 0;

  const fraudFlags = detectGiveawayFraud({
    email: payload.email,
    ipHash,
    existingByEmail,
    existingByUser,
    ipEntryCount,
    maxEntriesPerIp: campaign.eligibilityRules.maxEntriesPerIp,
  });
  if (shouldBlockEntry(fraudFlags)) {
    throw new Error("An entry already exists for this giveaway");
  }

  let referredByEntryId: string | null = null;
  let bonusEntries = 0;
  if (payload.referralCode?.trim()) {
    const referrer = await findGiveawayEntryByReferralCode(payload.referralCode.trim());
    if (referrer && referrer.campaignId === campaign.id && referrer.status === "active") {
      referredByEntryId = referrer.id;
      bonusEntries = 0;
    }
  }

  const sequence = await getNextGiveawayEntrySequence();
  const entryId = randomUUID();
  const verifyToken = campaign.requireEmailVerification ? generateVerifyToken() : null;

  const entry = await createGiveawayEntryRecord({
    id: entryId,
    campaignId: campaign.id,
    entryNumber: generateEntryNumber(sequence),
    userId: context.userId ?? null,
    email: payload.email,
    customerName: payload.customerName,
    customerPhone: payload.customerPhone,
    referralCode: generateReferralCode(`${entryId}-${Date.now()}`),
    referredByEntryId,
    baseEntries: 1,
    bonusEntries,
    totalEntries: 1 + bonusEntries,
    emailVerifyToken: verifyToken,
    ipHash,
    userAgentHash,
    fraudFlags,
    trackingToken: generateTrackingToken(),
    status: fraudFlags.length ? "active" : "active",
  });

  if (referredByEntryId) {
    await addReferralBonusToEntry(referredByEntryId, campaign.referralBonusEntries);
  }

  await appendGiveawayCampaignEvent({
    campaignId: campaign.id,
    type: "entry_created",
    message: `Entry ${entry.entryNumber}`,
    metadata: { entryId: entry.id },
  });

  if (campaign.requireEmailVerification && verifyToken) {
    await sendGiveawayEmail(entry, campaign, "verify", verifyToken);
  } else {
    await sendGiveawayEmail(entry, campaign, "confirmed");
  }

  await notifyGiveawayUpdate(entry, campaign, "entry");

  await logAuditEvent({
    action: "giveaway.entry.created",
    actorId: context.userId,
    resourceType: "giveaway_entry",
    resourceId: entry.id,
    request: context.request,
    metadata: { campaignId: campaign.id },
  });

  return entry;
}

export async function verifyGiveawayEmail(token: string) {
  const entry = await getGiveawayEntryByVerifyToken(token);
  if (!entry) throw new Error("Invalid or expired verification link");
  if (entry.emailVerified) return entry;

  const now = new Date().toISOString();
  await updateGiveawayEntryFields(entry.id, {
    emailVerified: true,
    emailVerifiedAt: now,
    emailVerifyToken: null,
    updatedAt: now,
  });

  const campaign = await getGiveawayCampaignById(entry.campaignId);
  const updated = await getGiveawayEntryById(entry.id);
  if (updated && campaign) {
    await sendGiveawayEmail(updated, campaign, "confirmed");
    await notifyGiveawayUpdate(updated, campaign, "verified");
  }
  return updated;
}

export async function claimGiveawaySocialBonus(
  entryId: string,
  platform: GiveawaySocialPlatform,
  trackingToken?: string
) {
  const entry = trackingToken
    ? await getGiveawayEntryByTrackingToken(trackingToken)
    : await getGiveawayEntryById(entryId);
  if (!entry || (entryId && entry.id !== entryId)) {
    throw new Error("Entry not found");
  }

  const campaign = await getGiveawayCampaignById(entry.campaignId);
  if (!campaign) throw new Error("Campaign not found");
  if (!campaign.allowedSocialPlatforms.includes(platform)) {
    throw new Error("Social platform not allowed for this campaign");
  }
  if (entry.socialClaims.some((c) => c.platform === platform)) {
    throw new Error("Bonus already claimed for this platform");
  }

  const socialClaims = [
    ...entry.socialClaims,
    { platform, claimedAt: new Date().toISOString() },
  ];
  const bonusEntries = entry.bonusEntries + campaign.socialBonusEntries;
  await updateGiveawayEntryFields(entry.id, {
    socialClaims,
    bonusEntries,
    totalEntries: entry.baseEntries + bonusEntries,
    updatedAt: new Date().toISOString(),
  });

  return getGiveawayEntryById(entry.id);
}

export async function runGiveawayDraw(input: {
  campaignId: string;
  winnerCount?: number;
  actorId?: string;
  actorEmail?: string;
  request?: Request;
}) {
  const campaign = await getGiveawayCampaignById(input.campaignId);
  if (!campaign) throw new Error("Campaign not found");
  if (campaign.status === "drawn") throw new Error("Winners already drawn");

  const entries = await listDrawEligibleEntries(campaign.id);
  const pool = buildDrawPool(entries, campaign.requireEmailVerification);
  if (pool.length === 0) throw new Error("No eligible entries for draw");

  await clearGiveawayWinners(campaign.id);
  const winnerEntryIds = runWeightedDraw(pool, input.winnerCount ?? campaign.winnerCount);
  const winners = await createGiveawayWinners(campaign.id, winnerEntryIds);

  await updateGiveawayCampaignFields(campaign.id, {
    status: "ended",
    updatedAt: new Date().toISOString(),
  });

  await appendGiveawayCampaignEvent({
    campaignId: campaign.id,
    type: "draw_completed",
    message: `${winners.length} winner(s) selected`,
    createdBy: input.actorId,
    metadata: { winnerEntryIds },
  });

  await logAuditEvent({
    action: "giveaway.draw.completed",
    actorId: input.actorId,
    actorEmail: input.actorEmail,
    resourceType: "giveaway_campaign",
    resourceId: campaign.id,
    request: input.request,
    metadata: { winnerCount: winners.length },
  });

  return { campaign, winners };
}

export async function announceGiveawayWinners(input: {
  campaignId: string;
  actorId?: string;
  actorEmail?: string;
  request?: Request;
}) {
  const campaign = await getGiveawayCampaignById(input.campaignId);
  if (!campaign) throw new Error("Campaign not found");

  const winners = await listGiveawayWinnersForCampaign(campaign.id);
  if (winners.length === 0) throw new Error("No winners to announce");

  await markGiveawayWinnersAnnounced(
    campaign.id,
    winners.map((w) => w.id)
  );

  for (const winner of winners) {
    const entry = await getGiveawayEntryById(winner.entryId);
    if (entry) {
      await sendGiveawayEmail(entry, campaign, "winner");
      await notifyGiveawayUpdate(entry, campaign, "winner");
    }
  }

  await appendGiveawayCampaignEvent({
    campaignId: campaign.id,
    type: "winners_announced",
    message: `${winners.length} winner(s) announced`,
    createdBy: input.actorId,
  });

  await logAuditEvent({
    action: "giveaway.winners.announced",
    actorId: input.actorId,
    actorEmail: input.actorEmail,
    resourceType: "giveaway_campaign",
    resourceId: campaign.id,
    request: input.request,
  });

  return listGiveawayWinnersForCampaign(campaign.id);
}

export async function saveGiveawayCampaign(
  input: Parameters<typeof upsertGiveawayCampaign>[0],
  actor?: { id?: string; email?: string; request?: Request }
): Promise<GiveawayCampaign> {
  const campaign = await upsertGiveawayCampaign(input);
  await appendGiveawayCampaignEvent({
    campaignId: campaign.id,
    type: input.id ? "campaign_updated" : "campaign_created",
    message: campaign.title,
    createdBy: actor?.id,
  });
  await logAuditEvent({
    action: input.id ? "giveaway.campaign.updated" : "giveaway.campaign.created",
    actorId: actor?.id,
    actorEmail: actor?.email,
    resourceType: "giveaway_campaign",
    resourceId: campaign.id,
    request: actor?.request,
  });
  return campaign;
}

export { exportGiveawayEntriesCsv };
