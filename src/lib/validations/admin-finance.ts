import { z } from "zod";

export const adminFinanceProviderSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2),
  slug: z.string().min(2),
  type: z.enum(["bank", "nbfc", "card_network"]).optional(),
  logoUrl: z.string().url().optional().or(z.literal("")),
  description: z.string().optional(),
  status: z.enum(["active", "inactive"]).optional(),
  minOrderValue: z.coerce.number().min(0).optional(),
  maxOrderValue: z.coerce.number().min(0).optional(),
  processingFeePct: z.coerce.number().min(0).max(10).optional(),
  sortOrder: z.coerce.number().int().optional(),
});

export const adminFinancePlanSchema = z.object({
  id: z.string().optional(),
  providerId: z.string().min(1),
  name: z.string().min(2),
  tenureMonths: z.coerce.number().int().min(1).max(60),
  interestRateAnnual: z.coerce.number().min(0).max(60).optional(),
  isNoCostEmi: z.boolean().optional(),
  emiType: z.enum(["card", "bank", "bnpl"]).optional(),
  minOrderValue: z.coerce.number().min(0).optional(),
  maxOrderValue: z.coerce.number().min(0).optional(),
  downPaymentMinPct: z.coerce.number().min(0).max(100).optional(),
  status: z.enum(["active", "inactive"]).optional(),
});

export const adminFinanceRejectSchema = z.object({
  reason: z.string().min(3).max(500),
});
