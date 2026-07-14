export type GiveawayCampaignStatus =
  | "draft"
  | "scheduled"
  | "active"
  | "ended"
  | "drawn"
  | "cancelled";

export type GiveawayEntryStatus = "active" | "disqualified" | "winner";

export type GiveawaySocialPlatform = "instagram" | "youtube" | "facebook" | "x";

export interface GiveawayFaq {
  question: string;
  answer: string;
}

export interface GiveawayEligibilityRules {
  minAge?: number;
  requirePhone?: boolean;
  blockedEmailDomains?: string[];
  maxEntriesPerIp?: number;
}

export interface GiveawaySocialClaim {
  platform: GiveawaySocialPlatform;
  claimedAt: string;
}

export interface GiveawayCampaign {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  status: GiveawayCampaignStatus;
  prizeTitle: string;
  prizeDescription: string;
  prizeImageUrl?: string | null;
  productSlug?: string | null;
  productName?: string | null;
  prizeValue?: number | null;
  winnerCount: number;
  maxEntries?: number | null;
  startsAt: string;
  endsAt: string;
  drawAt?: string | null;
  requireLogin: boolean;
  requireEmailVerification: boolean;
  referralBonusEntries: number;
  socialBonusEntries: number;
  allowedSocialPlatforms: GiveawaySocialPlatform[];
  eligibilityRules: GiveawayEligibilityRules;
  termsHtml: string;
  faqs: GiveawayFaq[];
  featured: boolean;
  winnersAnnounced: boolean;
  entryCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface GiveawayEntry {
  id: string;
  campaignId: string;
  entryNumber: string;
  userId?: string | null;
  email: string;
  customerName: string;
  customerPhone: string;
  referralCode: string;
  referredByEntryId?: string | null;
  socialClaims: GiveawaySocialClaim[];
  baseEntries: number;
  bonusEntries: number;
  totalEntries: number;
  emailVerified: boolean;
  emailVerifiedAt?: string | null;
  status: GiveawayEntryStatus;
  fraudFlags: string[];
  trackingToken: string;
  createdAt: string;
  updatedAt: string;
  campaign?: Pick<GiveawayCampaign, "slug" | "title" | "prizeTitle" | "status" | "endsAt">;
}

export interface GiveawayWinner {
  id: string;
  campaignId: string;
  entryId: string;
  rank: number;
  announcedAt?: string | null;
  notifiedAt?: string | null;
  createdAt: string;
  entry?: Pick<GiveawayEntry, "entryNumber" | "customerName" | "email">;
}

export interface CreateGiveawayEntryPayload {
  campaignSlug: string;
  email: string;
  customerName: string;
  customerPhone: string;
  referralCode?: string;
  ageConfirmed?: boolean;
}

export interface GiveawayAnalyticsSummary {
  totalCampaigns: number;
  activeCampaigns: number;
  totalEntries: number;
  verifiedEntries: number;
  totalWinners: number;
  entriesByCampaign: Array<{ campaignId: string; title: string; count: number }>;
}
