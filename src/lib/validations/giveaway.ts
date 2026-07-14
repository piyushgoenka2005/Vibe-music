import { z } from "zod";

export const createGiveawayEntrySchema = z.object({
  campaignSlug: z.string().min(2),
  email: z.string().email(),
  customerName: z.string().min(2).max(120),
  customerPhone: z.string().min(8).max(20),
  referralCode: z.string().min(4).max(16).optional(),
  ageConfirmed: z.boolean().optional(),
});

export const giveawaySocialClaimSchema = z.object({
  platform: z.enum(["instagram", "youtube", "facebook", "x"]),
});

export const giveawayVerifySchema = z.object({
  token: z.string().min(16),
});
