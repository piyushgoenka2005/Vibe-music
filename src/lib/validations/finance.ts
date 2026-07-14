import { z } from "zod";

export const emiCalculateSchema = z.object({
  orderValue: z.coerce.number().min(1000),
  downPayment: z.coerce.number().min(0).optional(),
  tenureMonths: z.coerce.number().int().min(1).max(60),
  interestRateAnnual: z.coerce.number().min(0).max(60).optional(),
  isNoCostEmi: z.boolean().optional(),
  processingFeePct: z.coerce.number().min(0).max(10).optional(),
  planId: z.string().optional(),
});

export const financeEligibilitySchema = z.object({
  orderValue: z.coerce.number().min(1000),
  downPayment: z.coerce.number().min(0).optional(),
  planId: z.string().min(1),
  emiType: z.enum(["card", "bank", "bnpl"]).optional(),
  monthlyIncome: z.coerce.number().min(0).optional(),
});

export const financeDocumentSchema = z.object({
  id: z.string().optional(),
  type: z.enum(["pan", "aadhaar", "salary_slip", "bank_statement", "other"]),
  fileName: z.string().min(1),
  fileUrl: z.string().url(),
  uploadedAt: z.string().optional(),
});

export const createFinanceApplicationSchema = z.object({
  productName: z.string().min(2),
  productSlug: z.string().optional(),
  orderValue: z.coerce.number().min(1000),
  downPayment: z.coerce.number().min(0).optional(),
  planId: z.string().min(1),
  email: z.string().email(),
  customerName: z.string().min(2),
  customerPhone: z.string().min(8),
  panNumber: z.string().regex(/^[A-Z]{5}[0-9]{4}[A-Z]$/).optional(),
  employmentType: z.enum(["salaried", "self_employed", "student", "other"]).optional(),
  monthlyIncome: z.coerce.number().min(0).optional(),
  notes: z.string().max(1000).optional(),
  documents: z.array(financeDocumentSchema).max(5).optional(),
});

export const financeCompareSchema = z.object({
  orderValue: z.coerce.number().min(1000),
  downPayment: z.coerce.number().min(0).optional(),
  emiType: z.enum(["card", "bank", "bnpl"]).optional(),
});
