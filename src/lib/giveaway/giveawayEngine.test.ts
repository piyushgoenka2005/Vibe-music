import { describe, expect, it } from "vitest";
import { getCampaignPhase, isCampaignAcceptingEntries } from "@/lib/giveaway/eligibilityEngine";
import { buildDrawPool, runWeightedDraw, getCountdownParts } from "@/lib/giveaway/drawEngine";
import {
  detectGiveawayFraud,
  shouldBlockEntry,
  generateReferralCode,
} from "@/lib/giveaway/fraudEngine";
import type { GiveawayCampaign } from "@/types/giveaway";

const baseCampaign: GiveawayCampaign = {
  id: "c1",
  slug: "test",
  title: "Test",
  subtitle: "",
  description: "",
  status: "active",
  prizeTitle: "Prize",
  prizeDescription: "",
  winnerCount: 1,
  startsAt: new Date(Date.now() - 86400000).toISOString(),
  endsAt: new Date(Date.now() + 86400000).toISOString(),
  requireLogin: false,
  requireEmailVerification: true,
  referralBonusEntries: 1,
  socialBonusEntries: 1,
  allowedSocialPlatforms: ["instagram"],
  eligibilityRules: {},
  termsHtml: "",
  faqs: [],
  featured: false,
  winnersAnnounced: false,
  createdAt: "",
  updatedAt: "",
};

describe("giveaway eligibility", () => {
  it("detects open campaign phase", () => {
    expect(getCampaignPhase(baseCampaign)).toBe("open");
    expect(isCampaignAcceptingEntries({ ...baseCampaign, entryCount: 0 }).ok).toBe(true);
  });

  it("rejects when max entries reached", () => {
    const result = isCampaignAcceptingEntries({
      ...baseCampaign,
      maxEntries: 10,
      entryCount: 10,
    });
    expect(result.ok).toBe(false);
  });
});

describe("giveaway draw", () => {
  it("builds weighted pool respecting email verification", () => {
    const pool = buildDrawPool(
      [
        { id: "a", totalEntries: 2, status: "active", emailVerified: true },
        { id: "b", totalEntries: 1, status: "active", emailVerified: false },
      ],
      true
    );
    expect(pool).toHaveLength(1);
    expect(pool[0].entryId).toBe("a");
  });

  it("selects winners without replacement", () => {
    const pool = [
      { entryId: "a", tickets: 1 },
      { entryId: "b", tickets: 1 },
      { entryId: "c", tickets: 1 },
    ];
    const winners = runWeightedDraw(pool, 2);
    expect(winners).toHaveLength(2);
    expect(new Set(winners).size).toBe(2);
  });
});

describe("giveaway fraud", () => {
  it("flags duplicate email", () => {
    const flags = detectGiveawayFraud({
      email: "test@example.com",
      existingByEmail: true,
    });
    expect(flags).toContain("duplicate_email");
    expect(shouldBlockEntry(flags)).toBe(true);
  });

  it("generates stable referral codes", () => {
    expect(generateReferralCode("seed")).toHaveLength(8);
  });
});

describe("giveaway countdown", () => {
  it("marks expired countdown", () => {
    const parts = getCountdownParts(new Date(Date.now() - 1000).toISOString());
    expect(parts.expired).toBe(true);
  });
});
