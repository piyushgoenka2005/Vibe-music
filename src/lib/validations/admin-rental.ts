import { z } from "zod";

export const adminRentalCategorySchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2),
  slug: z.string().min(2),
  description: z.string().optional(),
  imageUrl: z.string().url().optional().or(z.literal("")),
  sortOrder: z.coerce.number().int().optional(),
  status: z.enum(["active", "draft", "archived"]).optional(),
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
});

export const adminRentalProductSchema = z.object({
  id: z.string().optional(),
  slug: z.string().min(2),
  name: z.string().min(2),
  categoryId: z.string().min(1),
  catalogProductId: z.string().optional(),
  description: z.string().optional(),
  image: z.string().optional(),
  images: z.array(z.string()).optional(),
  specifications: z.record(z.string(), z.string()).optional(),
  status: z.enum(["active", "draft", "archived"]).optional(),
  totalUnits: z.coerce.number().int().min(1).optional(),
  availableUnits: z.coerce.number().int().min(0).optional(),
  minDurationHours: z.coerce.number().int().min(1).optional(),
  maxDurationDays: z.coerce.number().int().min(1).optional(),
  depositAmount: z.coerce.number().min(0).optional(),
  hourlyRate: z.coerce.number().min(0).optional(),
  dailyRate: z.coerce.number().min(0).optional(),
  weeklyRate: z.coerce.number().min(0).optional(),
  monthlyRate: z.coerce.number().min(0).optional(),
  pickupAvailable: z.boolean().optional(),
  deliveryAvailable: z.boolean().optional(),
  deliveryFee: z.coerce.number().min(0).optional(),
  pickupFee: z.coerce.number().min(0).optional(),
  lateFeePerDay: z.coerce.number().min(0).optional(),
  damagePolicy: z.string().optional(),
  termsText: z.string().optional(),
  agreementText: z.string().optional(),
  featured: z.boolean().optional(),
});

export const adminRentalUnitSchema = z.object({
  id: z.string().optional(),
  productId: z.string().min(1),
  serialNumber: z.string().optional(),
  label: z.string().min(1),
  status: z.enum(["available", "rented", "maintenance", "retired"]).optional(),
});

export const adminRentalPolicySchema = z.object({
  title: z.string().min(2),
  termsHtml: z.string(),
  agreementHtml: z.string(),
  cancellationPolicy: z.string(),
  lateFeePolicy: z.string(),
  damagePolicy: z.string(),
});

export const adminRentalBlockSchema = z.object({
  productId: z.string().min(1),
  unitId: z.string().optional(),
  startAt: z.string().min(1),
  endAt: z.string().min(1),
  reason: z.string().optional(),
});

export const adminRentalStatusSchema = z.object({
  status: z.enum([
    "pending",
    "confirmed",
    "active",
    "returned",
    "completed",
    "cancelled",
    "late",
  ]),
  note: z.string().optional(),
});

export const returnRentalBookingSchema = z.object({
  returnedAt: z.string().optional(),
  damageCharge: z.coerce.number().min(0).optional(),
});
