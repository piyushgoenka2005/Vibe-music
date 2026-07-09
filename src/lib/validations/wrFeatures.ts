import { z } from "zod";

export const createProductQuestionSchema = z.object({
  question: z.string().min(10).max(500),
});

export const adminProductQuestionSchema = z.object({
  status: z.enum(["pending", "approved", "rejected"]).optional(),
  answer: z.string().max(2000).optional(),
});

export const createReturnRequestSchema = z.object({
  reason: z.string().min(3).max(120),
  details: z.string().max(1000).optional(),
});

export const adminReturnRequestSchema = z.object({
  status: z.enum([
    "pending",
    "approved",
    "rejected",
    "received",
    "refunded",
    "cancelled",
  ]),
  adminNote: z.string().max(1000).optional(),
});

export const adminBrandSchema = z.object({
  name: z.string().min(1).max(120),
  slug: z.string().min(1).max(120).optional(),
});

export const adminUserUpdateSchema = z.object({
  displayName: z.string().min(1).max(120).optional(),
  role: z
    .enum(["super_admin", "admin", "inventory_manager", "customer_support"])
    .optional(),
  isActive: z.boolean().optional(),
});

export const adminRefundSchema = z.object({
  amount: z.number().positive().optional(),
  note: z.string().max(500).optional(),
});
