import { z } from "zod";

export const adminProductSchema = z.object({
  id: z.string().optional(),
  slug: z.string().min(1).max(255),
  name: z.string().min(1).max(255),
  brand: z.string().min(1),
  brandSlug: z.string().optional(),
  category: z.string().min(1),
  categorySlug: z.string().optional(),
  price: z.number().positive(),
  salePrice: z.number().positive().nullable().optional(),
  sku: z.preprocess(
    (value) => (value === "" ? undefined : value),
    z.string().min(4).max(20).optional()
  ),
  gstRate: z.union([z.literal(5), z.literal(12), z.literal(18), z.literal(28)]).optional(),
  rating: z.number().min(0).max(5).optional(),
  reviewCount: z.number().min(0).optional(),
  availability: z.enum(["in-stock", "out-of-stock", "limited"]).optional(),
  condition: z.enum(["new", "used", "open-box"]).optional(),
  status: z.enum(["active", "draft", "archived"]).optional(),
  stockQuantity: z.number().min(0).optional(),
  lowStockThreshold: z.number().min(0).optional(),
  imageColor: z.string().optional(),
  image: z.string().optional(),
  description: z.string().optional(),
  featured: z.boolean().optional(),
  trending: z.boolean().optional(),
  newArrival: z.boolean().optional(),
  metaTitle: z.string().max(255).optional(),
  metaDescription: z.string().max(500).optional(),
});

export const adminCategorySchema = z.object({
  name: z.string().min(1).max(255),
  slug: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  parentId: z.string().nullable().optional(),
  imageUrl: z.string().url().optional().or(z.literal("")),
  isFeatured: z.boolean().optional(),
  sortOrder: z.number().optional(),
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
});

export const adminCouponSchema = z.object({
  code: z.string().min(3).max(20),
  label: z.string().min(1),
  type: z.enum(["percentage", "flat"]),
  value: z.number().positive(),
  minOrderAmount: z.number().min(0).optional(),
  maxUses: z.number().min(1).optional(),
  isActive: z.boolean().optional(),
  startsAt: z.string().optional(),
  expiresAt: z.string().optional(),
});

export const adminOrderStatusSchema = z.object({
  status: z.enum(["pending", "processing", "shipped", "delivered", "cancelled"]),
  note: z.string().optional(),
});

export const adminInventoryAdjustSchema = z.object({
  productId: z.string().min(1),
  newQuantity: z.number().min(0),
  reason: z.string().min(1).max(500),
});

export const adminReviewStatusSchema = z.object({
  status: z.enum(["pending", "approved", "rejected"]),
  adminReply: z.string().optional(),
});

export const adminSettingsSchema = z.object({
  storeName: z.string().min(1).optional(),
  storeEmail: z.string().email().optional(),
  storePhone: z.string().optional(),
  storeAddress: z.string().optional(),
  gstNumber: z.string().optional(),
  defaultGstRate: z.union([z.literal(5), z.literal(12), z.literal(18), z.literal(28)]).optional(),
  sellerState: z.string().optional(),
  freeShippingThreshold: z.number().min(0).optional(),
  standardShippingCharge: z.number().min(0).optional(),
  razorpayEnabled: z.boolean().optional(),
});

export const adminNoteSchema = z.object({
  note: z.string().min(1).max(2000),
});

export const adminCustomerStatusSchema = z.object({
  isActive: z.boolean(),
});
