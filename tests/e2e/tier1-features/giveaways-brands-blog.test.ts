import { describe, it, expect } from "vitest";
import { getCampaignPhase, isCampaignAcceptingEntries } from "@/lib/giveaway/eligibilityEngine";
import { getCountdownParts } from "@/lib/giveaway/countdown";
import {
  resolveCategoryLabel,
  computeReadingMinutes,
  matchesBlogSearch,
  BLOG_CATEGORIES,
} from "@/lib/blog/blogEngine";
import { STOREFRONT_CATALOG_BRANDS } from "@/data/storefrontBrands";
import { createGiveawayEntrySchema } from "@/lib/validations/giveaway";
import type { GiveawayCampaign } from "@/types/giveaway";
import type { BlogPostSummary } from "@/types/blog";

describe("Tier 1: Giveaways, Brands & Blog Engine", () => {
  const mockCampaign: GiveawayCampaign = {
    id: "giveaway-prs-guitar",
    slug: "win-prs-custom-24",
    title: "Win a PRS Custom 24 Guitar",
    subtitle: "Celebrate Vibe Music Anniversary",
    description: "Enter for a chance to win the iconic PRS SE Custom 24.",
    status: "active",
    prizeTitle: "PRS SE Custom 24 Electric Guitar",
    prizeDescription: "Flame maple top, 85/15 'S' pickups",
    prizeValue: 75000,
    winnerCount: 1,
    startsAt: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
    endsAt: new Date(Date.now() + 86400000 * 5).toISOString(), // 5 days from now
    requireLogin: false,
    requireEmailVerification: true,
    referralBonusEntries: 2,
    socialBonusEntries: 1,
    allowedSocialPlatforms: ["instagram", "youtube"],
    eligibilityRules: { minAge: 18, countries: ["IN"] },
    termsHtml: "<p>Terms apply.</p>",
    faqs: [],
    featured: true,
    winnersAnnounced: false,
    entryCount: 142,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  it("evaluates giveaway campaign lifecycle phase and acceptance status", () => {
    // Active / Open
    expect(getCampaignPhase(mockCampaign)).toBe("open");
    const accepting = isCampaignAcceptingEntries(mockCampaign);
    expect(accepting.ok).toBe(true);

    // Closed when past endsAt
    const expiredCampaign: GiveawayCampaign = {
      ...mockCampaign,
      endsAt: new Date(Date.now() - 1000).toISOString(),
    };
    expect(getCampaignPhase(expiredCampaign)).toBe("closed");
    expect(isCampaignAcceptingEntries(expiredCampaign).ok).toBe(false);

    // Upcoming when before startsAt
    const upcomingCampaign: GiveawayCampaign = {
      ...mockCampaign,
      startsAt: new Date(Date.now() + 86400000).toISOString(),
      endsAt: new Date(Date.now() + 86400000 * 2).toISOString(),
    };
    expect(getCampaignPhase(upcomingCampaign)).toBe("upcoming");
    expect(isCampaignAcceptingEntries(upcomingCampaign).ok).toBe(false);
  });

  it("calculates real-time countdown parts for live giveaway deadline", () => {
    const targetDate = new Date(Date.now() + 2 * 86400000 + 4 * 3600000 + 15 * 60000); // ~2 days 4 hrs 15 mins
    const parts = getCountdownParts(targetDate.toISOString());

    expect(parts.days).toBeGreaterThanOrEqual(1);
    expect(parts.hours).toBeGreaterThanOrEqual(0);
    expect(parts.minutes).toBeGreaterThanOrEqual(0);
    expect(parts.seconds).toBeGreaterThanOrEqual(0);
  });

  it("validates giveaway user entry schema and email sanitization", () => {
    const validEntry = {
      campaignSlug: "win-prs-custom-24",
      customerName: "Devendra Patel",
      email: "devendra@example.com",
      customerPhone: "9876543210",
      ageConfirmed: true,
    };
    const result = createGiveawayEntrySchema.safeParse(validEntry);
    expect(result.success).toBe(true);

    // Rejects entry if email is invalid
    const rejectedEntry = {
      ...validEntry,
      email: "not-an-email",
    };
    expect(createGiveawayEntrySchema.safeParse(rejectedEntry).success).toBe(false);
  });

  it("maintains sorted catalog brands and case-insensitive resolution", () => {
    expect(STOREFRONT_CATALOG_BRANDS.length).toBeGreaterThan(0);

    // Verify brands are alphabetically sorted
    for (let i = 1; i < STOREFRONT_CATALOG_BRANDS.length; i++) {
      expect(
        STOREFRONT_CATALOG_BRANDS[i].localeCompare(STOREFRONT_CATALOG_BRANDS[i - 1]),
      ).toBeGreaterThanOrEqual(0);
    }

    // Verify notable core brands exist
    const brandSet = new Set(STOREFRONT_CATALOG_BRANDS.map((b) => b.toLowerCase()));
    expect(brandSet.has("fender") || brandSet.has("yamaha") || brandSet.has("roland")).toBe(true);
  });

  it("resolves blog categories, filters search queries, and calculates reading time", () => {
    expect(BLOG_CATEGORIES.length).toBeGreaterThan(0);
    expect(resolveCategoryLabel("guitars")).toBe("Guitars");
    expect(resolveCategoryLabel("live-sound")).toBe("Live Sound");

    const samplePost: BlogPostSummary = {
      id: "post-1",
      slug: "choosing-first-audio-interface",
      title: "How to Choose Your First Audio Interface in 2026",
      excerpt: "A comprehensive guide on preamps, latency, and connectivity for bedroom producers.",
      coverImage: "/images/blog/audio-interface.jpg",
      categorySlug: "studio",
      categoryLabel: "Studio",
      tags: ["Audio Interface", "Home Studio", "Recording"],
      authorName: "Vikram Sen",
      authorAvatar: "/images/authors/vikram.jpg",
      readingMinutes: 5,
      publishedAt: "2026-10-15T12:00:00Z",
      featured: true,
    };

    // Blog search matching title, tags, or author
    expect(matchesBlogSearch(samplePost, "interface")).toBe(true);
    expect(matchesBlogSearch(samplePost, "vikram")).toBe(true);
    expect(matchesBlogSearch(samplePost, "recording")).toBe(true);
    expect(matchesBlogSearch(samplePost, "synthesizer keyboard")).toBe(false);

    // Reading minutes calculation
    const shortText = "Word ".repeat(150);
    expect(computeReadingMinutes(shortText)).toBe(1);

    const longText = "Word ".repeat(650);
    expect(computeReadingMinutes(longText)).toBe(4); // ceil(650 / 200) = 4
  });
});
