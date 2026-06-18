import { z } from "zod";

export const validateCouponBodySchema = z.object({
  code: z.string().trim().min(1).max(64),
  subtotal: z.number().min(0),
});
