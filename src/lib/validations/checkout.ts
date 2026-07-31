import { z } from "zod";

const gstRateSchema = z.union([
  z.literal(5),
  z.literal(12),
  z.literal(18),
  z.literal(28),
]);

export const checkoutShippingAddressSchema = z.object({
  name: z.string().trim().min(1).max(120),
  line1: z.string().trim().min(1).max(200),
  line2: z.string().trim().max(200).optional(),
  city: z.string().trim().min(1).max(100),
  state: z.string().trim().min(1).max(100),
  postalCode: z.string().trim().min(4).max(12),
  country: z.string().trim().min(1).max(100),
  phone: z.string().trim().max(20).optional(),
});

export const createOrderItemSchema = z.object({
  productId: z.string().trim().min(1).max(120),
  variantId: z.string().trim().max(120).optional(),
  variantSku: z.string().trim().max(120).optional(),
  variantLabel: z.string().trim().max(200).optional(),
  name: z.string().trim().min(1).max(240),
  quantity: z.number().int().positive().max(99),
  price: z.number().nonnegative(),
  gstRate: gstRateSchema,
});

export const createOrderSchema = z.object({
  items: z.array(createOrderItemSchema).min(1).max(50),
  email: z.string().trim().email().max(160),
  customerName: z.string().trim().max(120).optional(),
  customerPhone: z.string().trim().max(20).optional(),
  couponCode: z.string().trim().max(64).nullable().optional(),
  couponDiscount: z.number().nonnegative().optional(),
  shippingAddress: checkoutShippingAddressSchema,
  paymentMethod: z.literal("razorpay", {
    message: "Only Razorpay online payment is supported",
  }),
  buyerState: z.string().trim().max(100).optional(),
  shippingMethod: z.enum(["standard", "express", "overnight"]).optional(),
});

export const verifyPaymentSchema = z.object({
  orderId: z.string().trim().min(1).max(120),
  razorpayOrderId: z.string().trim().min(1).max(120),
  razorpayPaymentId: z.string().trim().min(1).max(120),
  razorpaySignature: z.string().trim().min(1).max(256),
});

export const releaseReservationSchema = z.object({
  orderId: z.string().trim().min(1).max(120),
  trackingToken: z.string().trim().min(1).max(120).optional(),
});

export const demoPaymentSchema = z
  .object({
    orderId: z.string().trim().min(1).max(120),
    email: z.string().trim().email().max(160).optional(),
    trackingToken: z.string().trim().min(1).max(120).optional(),
  })
  .refine((value) => Boolean(value.email || value.trackingToken), {
    message: "Email or tracking token is required.",
  });

export const resumePaymentSchema = z.object({
  email: z.string().trim().email().max(160).optional(),
  trackingToken: z.string().trim().min(1).max(120).optional(),
});

export const blogCommentSchema = z
  .object({
    authorName: z.string().trim().min(2).max(80),
    email: z.string().trim().email().max(160),
    body: z.string().trim().min(10).max(2000),
    website: z.string().max(0).optional().or(z.literal("")),
  })
  .strict();

export const accountWishlistPutSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.string().min(1).max(120),
        slug: z.string().min(1).max(200),
        name: z.string().min(1).max(240),
        brand: z.string().max(120),
        price: z.coerce.number().nonnegative(),
        imageColor: z.string().max(64),
        image: z.string().max(500),
        addedAt: z.coerce.number().optional(),
      })
    )
    .max(200),
});
