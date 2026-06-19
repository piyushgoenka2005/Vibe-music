import { z } from "zod";

const variantAttributeSchema = z.object({
  type: z.enum(["color", "size", "finish", "custom"]),
  name: z.string().min(1).max(50),
  value: z.string().min(1).max(100),
});

const productVariantSchema = z.object({
  id: z.string().optional(),
  label: z.string().max(200).optional(),
  sku: z.string().min(4).max(32).optional(),
  price: z.number().positive(),
  stock: z.number().min(0),
  attributes: z.array(variantAttributeSchema).default([]),
  images: z.array(z.string().url().or(z.literal(""))).default([]),
  isDefault: z.boolean().optional(),
});

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
  images: z.array(z.string()).optional(),
  metaTitle: z.string().max(255).optional(),
  metaDescription: z.string().max(500).optional(),
  variants: z.array(productVariantSchema).optional(),
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
  status: z.enum([
    "pending",
    "confirmed",
    "processing",
    "shipped",
    "delivered",
    "cancelled",
    "refunded",
  ]),
  note: z.string().optional(),
});

export const adminInventoryAdjustSchema = z.object({
  productId: z.string().min(1),
  newQuantity: z.number().min(0),
  reason: z.string().min(1).max(500),
});

export { adminReviewStatusSchema } from "@/lib/validations/review";

export const adminBannerSchema = z.object({
  title: z.string().min(1).max(200),
  subtitle: z.string().max(500).optional(),
  image: z.string().url("Desktop image URL is required"),
  mobileImage: z.string().url().optional().or(z.literal("")),
  ctaText: z.string().min(1).max(100),
  ctaLink: z.string().min(1).max(500),
  startDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
  priority: z.number().int().min(0).optional(),
  status: z.enum(["active", "inactive"]),
});

export const adminBannerReorderSchema = z.object({
  orderedIds: z.array(z.string().min(1)).min(1),
});

const homepageSectionKeySchema = z.enum([
  "new_arrivals",
  "best_sellers",
  "trending",
  "staff_picks",
  "featured_categories",
  "deals_of_the_day",
  "brand_strip",
]);

export const adminHomepageSectionSchema = z.object({
  title: z.string().min(1).max(200),
  subtitle: z.string().max(500).optional(),
  accentLabel: z.string().max(100).optional(),
  ctaText: z.string().max(100).optional(),
  ctaLink: z.string().max(500).optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().int().min(0).optional(),
  sourceMode: z.enum(["manual", "auto"]).optional(),
  maxItems: z.number().int().min(1).max(50).optional(),
  layout: z
    .enum([
      "product_grid",
      "product_carousel",
      "category_grid",
      "deals_slider",
      "brand_strip",
    ])
    .optional(),
});

export const adminHomepageSectionItemSchema = z.object({
  sectionKey: homepageSectionKeySchema,
  sortOrder: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
  productId: z.string().optional(),
  categorySlug: z.string().optional(),
  brandId: z.string().optional(),
  customImage: z.string().url().optional().or(z.literal("")),
  customTitle: z.string().max(200).optional(),
  customHref: z.string().max(500).optional(),
  badgeLabel: z.string().max(100).optional(),
  offerText: z.string().max(200).optional(),
  startDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
});

export const adminProductBundleSchema = z.object({
  relatedProductIds: z.array(z.string().min(1)).max(6),
  discountPercent: z.number().min(0).max(50).optional(),
  isActive: z.boolean().optional(),
  productName: z.string().max(255).optional(),
  productSlug: z.string().max(255).optional(),
});

export const adminProductRelatedSchema = z.object({
  relatedProductIds: z.array(z.string().min(1)).max(8),
  isActive: z.boolean().optional(),
  productName: z.string().max(255).optional(),
  productSlug: z.string().max(255).optional(),
});

export const adminHomepageItemReorderSchema = z.object({
  sectionKey: homepageSectionKeySchema,
  orderedIds: z.array(z.string().min(1)).min(1),
});

const blogPostStatusSchema = z.enum(["draft", "published", "scheduled"]);

const blogPostFieldsSchema = z.object({
  title: z.string().min(1).max(200),
  slug: z.string().max(200).optional(),
  excerpt: z.string().max(500).optional(),
  content: z.string().min(1),
  coverImage: z.string().url().optional().or(z.literal("")),
  tags: z.array(z.string().min(1).max(50)).max(20).optional(),
  seoTitle: z.string().max(70).optional(),
  seoDescription: z.string().max(160).optional(),
  status: blogPostStatusSchema,
  scheduledAt: z.string().optional().nullable(),
});

function validateBlogSchedule(
  value: { status?: "draft" | "published" | "scheduled"; scheduledAt?: string | null },
  ctx: z.RefinementCtx
): void {
  if (value.status === "scheduled" && !value.scheduledAt) {
    ctx.addIssue({
      code: "custom",
      message: "Scheduled posts require a publish date",
      path: ["scheduledAt"],
    });
  }
}

export const adminBlogPostSchema = blogPostFieldsSchema.superRefine(validateBlogSchedule);

export const adminBlogPostUpdateSchema = blogPostFieldsSchema
  .partial()
  .superRefine(validateBlogSchedule);

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
