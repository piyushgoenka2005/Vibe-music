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

export const createSupportTicketSchema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email(),
  subject: z.string().min(3).max(160),
  message: z.string().min(10).max(4000),
  category: z
    .enum(["order", "shipping", "returns", "product", "payment", "other"])
    .default("other"),
  orderId: z.string().max(64).optional(),
});

export const adminSupportTicketSchema = z.object({
  status: z
    .enum(["open", "in_progress", "waiting_customer", "resolved", "closed"])
    .optional(),
  priority: z.enum(["low", "normal", "high", "urgent"]).optional(),
  adminNote: z.string().max(2000).optional(),
  assignedTo: z.string().max(120).optional(),
});

export const notificationPreferencesSchema = z.object({
  orderUpdates: z.boolean().optional(),
  promotions: z.boolean().optional(),
  productAlerts: z.boolean().optional(),
  newsletter: z.boolean().optional(),
});

export const markNotificationReadSchema = z.object({
  id: z.string().min(1).optional(),
  markAllRead: z.boolean().optional(),
});

export const adminInviteSchema = z.object({
  email: z.string().email(),
  displayName: z.string().min(1).max(120),
  role: z.enum(["super_admin", "admin", "inventory_manager", "customer_support"]),
  password: z.string().min(8).max(128),
});

export const contentPageSchema = z.object({
  slug: z.string().min(1).max(80),
  title: z.string().min(1).max(160),
  eyebrow: z.string().max(80).default("Customer Service"),
  sections: z.array(
    z.object({
      heading: z.string().max(160).optional(),
      paragraphs: z.array(z.string().max(4000)).min(1),
    })
  ),
});

export const shippingZoneSchema = z.object({
  id: z.string().max(80).optional(),
  name: z.string().min(1).max(120),
  description: z.string().max(500).optional(),
  states: z.array(z.string().max(80)).default([]),
  pinCodePrefixes: z.array(z.string().max(6)).default([]),
  methodCharges: z
    .object({
      standard: z.number().nonnegative().optional(),
      express: z.number().nonnegative().optional(),
      overnight: z.number().nonnegative().optional(),
    })
    .default({}),
  freeShippingThreshold: z.number().nonnegative().optional(),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().nonnegative().default(0),
});
