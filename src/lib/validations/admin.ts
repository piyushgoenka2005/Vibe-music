import { z } from "zod";
import { MAX_COUPON_PRODUCT_URLS } from "@/lib/coupons/parseProductUrl";

const variantAttributeSchema = z.object({
  type: z.enum(["color", "size", "finish", "custom"]),
  name: z.string().min(1).max(50),
  value: z.string().max(100),
});

const productSpecSchema = z.object({
  label: z.string(),
  value: z.string(),
});

const productVideoSchema = z
  .object({
    id: z.string().optional(),
    title: z.string(),
    duration: z.string().optional(),
    thumbnailColor: z.string().optional(),
    embedUrl: z.string(),
  })
  .transform((video) => {
    const duration = video.duration?.trim();
    return {
      id: video.id?.trim() || `video-${Math.random().toString(36).slice(2, 10)}`,
      title: video.title,
      ...(duration ? { duration } : {}),
      thumbnailColor: video.thumbnailColor?.trim() || "#1a1a1a",
      embedUrl: video.embedUrl,
    };
  });

const productVariantSchema = z.object({
  id: z.string().optional(),
  label: z.string().max(200).optional(),
  sku: z.string().min(4).max(32).optional(),
  /** ₹0 allowed for Coming Soon / unpublished pricing. */
  price: z.number().min(0),
  stock: z.number().min(0),
  attributes: z.array(variantAttributeSchema).default([]),
  images: z.array(z.string()).default([]),
  isDefault: z.boolean().optional(),
});

/** Relative app path or https URL — blocks javascript: and protocol-relative. */
const safeStorefrontHref = z
  .string()
  .max(500)
  .refine(
    (value) => {
      const href = value.trim();
      if (!href) return false;
      if (href.startsWith("/") && !href.startsWith("//")) return true;
      try {
        const url = new URL(href);
        return url.protocol === "https:" || url.protocol === "http:";
      } catch {
        return false;
      }
    },
    { message: "Link must be a relative path or http(s) URL" },
  );

export const adminProductSchema = z.object({
  id: z.string().optional(),
  slug: z.string().min(1).max(255),
  name: z.string().min(1).max(255),
  brand: z.string().min(1),
  brandSlug: z.string().optional(),
  category: z.string().min(1),
  categorySlug: z.string().optional(),
  subcategory: z.string().optional(),
  /** ₹0 allowed for Coming Soon products. */
  price: z.number().min(0),
  originalPrice: z.number().min(0).optional(),
  salePrice: z.number().min(0).nullable().optional(),
  sku: z.preprocess(
    (value) => (value === "" ? undefined : value),
    z.string().min(4).max(20).optional(),
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
  /** Ordered frame URLs for PDP 360° view. */
  spin360Images: z.array(z.string()).optional(),
  inTheBox: z.array(z.string()).optional(),
  videos: z.array(productVideoSchema).optional(),
  detailSpecs: z.array(productSpecSchema).optional(),
  specifications: z.record(z.string(), z.string()).optional(),
  metaTitle: z.string().max(255).optional(),
  metaDescription: z.string().max(500).optional(),
  variants: z.array(productVariantSchema).optional(),
  guitarSpecs: z.record(z.string(), z.string()).optional(),
  similarProductIds: z.array(z.string().min(1)).max(4).optional(),
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

export const adminCouponSchema = z
  .object({
    code: z.string().min(3).max(20),
    label: z.string().min(1),
    type: z.enum(["percentage", "flat", "free_shipping"]),
    value: z.number().min(0),
    minOrderAmount: z.number().min(0).optional(),
    maxUses: z.number().min(1).optional(),
    maxUsesPerUser: z.number().min(1).optional(),
    isActive: z.boolean().optional(),
    kind: z.enum(["standard", "referral"]).optional(),
    referralOwnerUserId: z.string().min(1).optional(),
    referralOwnerEmail: z.string().email().optional(),
    parentCouponId: z.string().min(1).optional(),
    utmSource: z.string().max(120).optional(),
    utmMedium: z.string().max(120).optional(),
    utmCampaign: z.string().max(120).optional(),
    utmContent: z.string().max(120).optional(),
    scope: z.enum(["store", "products"]).optional(),
    productIds: z.array(z.string().min(1)).max(MAX_COUPON_PRODUCT_URLS).optional(),
    startsAt: z.string().optional(),
    expiresAt: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.type !== "free_shipping" && data.value <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Discount value must be greater than zero",
        path: ["value"],
      });
    }
    if (data.scope === "products" && (!data.productIds || data.productIds.length === 0)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Select at least one product for product-scoped coupons",
        path: ["productIds"],
      });
    }
    if (data.productIds && data.productIds.length > MAX_COUPON_PRODUCT_URLS) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `A coupon can apply to at most ${MAX_COUPON_PRODUCT_URLS} products`,
        path: ["productIds"],
      });
    }
    if (data.kind === "referral" && !data.referralOwnerUserId && !data.referralOwnerEmail) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Referral coupons require an owner user or email",
        path: ["referralOwnerEmail"],
      });
    }
  });

export const adminCouponPatchSchema = z.object({
  isActive: z.boolean().optional(),
});

export const adminGenerateReferralCouponSchema = z.object({
  ownerUserId: z.string().min(1),
  ownerEmail: z.string().email(),
  ownerName: z.string().max(120).optional(),
  templateCouponId: z.string().min(1).optional(),
  label: z.string().min(1).optional(),
  type: z.enum(["percentage", "flat", "free_shipping"]).optional(),
  value: z.number().positive().optional(),
  maxUses: z.number().min(1).optional(),
  maxUsesPerUser: z.number().min(1).optional(),
  utmSource: z.string().max(120).optional(),
  utmMedium: z.string().max(120).optional(),
  utmCampaign: z.string().max(120).optional(),
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
  title: z.string().max(200).optional().default(""),
  subtitle: z.string().max(500).optional().or(z.literal("")),
  image: z.string().url("Desktop image URL is required"),
  mobileImage: z.string().url().optional().or(z.literal("")),
  ctaText: z.string().max(100).optional().default(""),
  ctaLink: safeStorefrontHref.optional().or(z.literal("")).default("/search"),
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
  "browse_by_categories",
  "category_bento",
  "deals_of_the_day",
  "big_names_deals",
  "brand_strip",
  "featured_stories",
  "social_rail",
]);

export const adminHomepageSectionSchema = z.object({
  title: z.string().min(1).max(200),
  subtitle: z.string().max(500).optional(),
  accentLabel: z.string().max(100).optional(),
  ctaText: z.string().max(100).optional(),
  ctaLink: z.union([z.literal(""), safeStorefrontHref]).optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().int().min(0).optional(),
  sourceMode: z.enum(["manual", "auto"]).optional(),
  maxItems: z.number().int().min(1).max(50).optional(),
  layout: z
    .enum([
      "product_grid",
      "product_carousel",
      "category_grid",
      "browse_category_cards",
      "category_bento",
      "deals_slider",
      "brand_strip",
      "big_names_deals",
      "story_banners",
      "social_rail",
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
  customImage: z.union([z.string().url(), safeStorefrontHref, z.literal("")]).optional(),
  customTitle: z.string().max(200).optional(),
  customHref: z.union([z.literal(""), safeStorefrontHref]).optional(),
  badgeLabel: z.string().max(100).optional(),
  offerText: z.string().max(500).optional(),
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
  categorySlug: z.string().max(80).optional(),
  categoryLabel: z.string().max(80).optional(),
  featured: z.boolean().optional(),
  authorBio: z.string().max(500).optional(),
  authorAvatar: z.string().url().optional().or(z.literal("")),
  seoTitle: z.string().max(70).optional(),
  seoDescription: z.string().max(160).optional(),
  status: blogPostStatusSchema,
  scheduledAt: z.string().optional().nullable(),
});

function validateBlogSchedule(
  value: { status?: "draft" | "published" | "scheduled"; scheduledAt?: string | null },
  ctx: z.RefinementCtx,
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

export const adminProductBulkSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("delete"),
    ids: z.array(z.string().min(1)).min(1).max(500),
  }),
  z.object({
    action: z.literal("archive"),
    ids: z.array(z.string().min(1)).min(1).max(500),
  }),
  z.object({
    action: z.literal("activate"),
    ids: z.array(z.string().min(1)).min(1).max(500),
  }),
  z.object({
    action: z.literal("draft"),
    ids: z.array(z.string().min(1)).min(1).max(500),
  }),
  z.object({
    action: z.literal("update_stock"),
    ids: z.array(z.string().min(1)).min(1).max(500),
    stock: z.number().finite().min(0),
  }),
  z.object({
    action: z.literal("update_category"),
    ids: z.array(z.string().min(1)).min(1).max(500),
    category: z.string().min(1).max(255),
    categorySlug: z.string().min(1).max(255),
  }),
]);

export const adminNotificationMarkSchema = z
  .object({
    id: z.string().min(1).optional(),
    markAllRead: z.boolean().optional(),
  })
  .refine((value) => value.markAllRead === true || Boolean(value.id), {
    message: "Provide markAllRead or a notification id",
  });

export const adminDeleteImagesSchema = z.object({
  urls: z.array(z.string().trim().min(1).max(2000)).min(1).max(50),
});

export const adminNewsletterCreateSchema = z.object({
  email: z.string().email(),
  firstName: z.string().max(100).optional(),
  lastName: z.string().max(100).optional(),
  marketing: z.boolean().optional(),
});

export const adminNewsletterDeleteQuerySchema = z.object({
  email: z.string().trim().email(),
});

export const adminNewsletterPatchSchema = z.object({
  email: z.string().email(),
  firstName: z.string().max(100).optional(),
  lastName: z.string().max(100).optional(),
  marketing: z.boolean().optional(),
});

export const adminProductDuplicateActionSchema = z.object({
  action: z.literal("duplicate"),
});

export const adminProductUploadMetaSchema = z.object({
  categorySlug: z.string().min(1).max(100).default("general"),
  productSlug: z.string().max(200).optional(),
});

export const adminImageMimeTypeSchema = z.object({
  mimeType: z
    .string()
    .min(1)
    .refine((value) => value.startsWith("image/"), "File must be an image"),
});
