import { z } from "zod";

export const rentalDurationTypeSchema = z.enum([
  "hourly",
  "daily",
  "weekly",
  "monthly",
]);

export const rentalFulfillmentSchema = z.enum(["pickup", "delivery"]);

export const rentalQuoteSchema = z
  .object({
    productId: z.string().optional(),
    productSlug: z.string().optional(),
    quantity: z.coerce.number().int().min(1).max(10).optional(),
    durationType: rentalDurationTypeSchema,
    startAt: z.string().min(1),
    endAt: z.string().min(1),
    fulfillment: rentalFulfillmentSchema,
  })
  .refine((value) => Boolean(value.productId || value.productSlug), {
    message: "productId or productSlug is required",
  });

export const rentalAddressSchema = z.object({
  name: z.string().min(2),
  phone: z.string().min(8),
  line1: z.string().min(3),
  line2: z.string().optional(),
  city: z.string().min(2),
  state: z.string().min(2),
  postalCode: z.string().min(4),
  country: z.string().optional(),
});

export const createRentalBookingSchema = z.object({
  items: z.array(rentalQuoteSchema).min(1).max(5),
  email: z.string().email(),
  customerName: z.string().min(2),
  customerPhone: z.string().min(8),
  fulfillment: rentalFulfillmentSchema,
  address: rentalAddressSchema.optional(),
  paymentMethod: z.literal("razorpay"),
  buyerState: z.string().optional(),
  termsAccepted: z.literal(true),
  agreementAccepted: z.literal(true),
  notes: z.string().max(1000).optional(),
});

export const verifyRentalPaymentSchema = z.object({
  bookingId: z.string().min(1),
  razorpayOrderId: z.string().min(1),
  razorpayPaymentId: z.string().min(1),
  razorpaySignature: z.string().min(1),
});

export const cancelRentalBookingSchema = z.object({
  reason: z.string().max(500).optional(),
});

export const returnRentalBookingSchema = z.object({
  returnedAt: z.string().optional(),
  damageCharge: z.coerce.number().min(0).optional(),
});
