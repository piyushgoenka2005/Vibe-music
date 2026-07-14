import { z } from "zod";

export const adminGiveawayCampaignSchema = z.object({
  id: z.string().optional(),
  slug: z.string().min(2).max(80),
  title: z.string().min(2).max(160),
  subtitle: z.string().max(240).optional(),
  description: z.string().max(5000).optional(),
  status: z.enum(["draft", "scheduled", "active", "ended", "drawn", "cancelled"]).optional(),
  prizeTitle: z.string().min(2).max(160),
  prizeDescription: z.string().max(2000).optional(),
  prizeImageUrl: z.string().url().optional().or(z.literal("")),
  productSlug: z.string().optional(),
  productName: z.string().optional(),
  prizeValue: z.coerce.number().min(0).optional(),
  winnerCount: z.coerce.number().int().min(1).max(20).optional(),
  maxEntries: z.coerce.number().int().min(1).optional().nullable(),
  startsAt: z.string().min(1),
  endsAt: z.string().min(1),
  drawAt: z.string().optional().nullable(),
  requireLogin: z.boolean().optional(),
  requireEmailVerification: z.boolean().optional(),
  referralBonusEntries: z.coerce.number().int().min(0).max(10).optional(),
  socialBonusEntries: z.coerce.number().int().min(0).max(10).optional(),
  allowedSocialPlatforms: z
    .array(z.enum(["instagram", "youtube", "facebook", "x"]))
    .optional(),
  eligibilityRules: z
    .object({
      minAge: z.coerce.number().int().min(13).max(100).optional(),
      requirePhone: z.boolean().optional(),
      blockedEmailDomains: z.array(z.string()).optional(),
      maxEntriesPerIp: z.coerce.number().int().min(1).max(20).optional(),
    })
    .optional(),
  termsHtml: z.string().max(20000).optional(),
  faqs: z
    .array(
      z.object({
        question: z.string().min(2),
        answer: z.string().min(2),
      })
    )
    .optional(),
  featured: z.boolean().optional(),
});

export const adminGiveawayDrawSchema = z.object({
  winnerCount: z.coerce.number().int().min(1).max(20).optional(),
});
