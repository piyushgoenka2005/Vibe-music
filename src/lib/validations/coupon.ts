import { z } from "zod";

const couponCartLineSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().positive(),
  price: z.number().min(0),
});

export const validateCouponBodySchema = z.object({
  code: z.string().trim().min(1).max(64),
  subtotal: z.number().min(0),
  items: z.array(couponCartLineSchema).optional(),
  customerEmail: z.string().trim().email().max(160).optional(),
});
