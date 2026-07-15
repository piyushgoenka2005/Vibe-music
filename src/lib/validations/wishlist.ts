import { z } from "zod";

export const wishlistShareItemSchema = z.object({
  productId: z.string().min(1),
  slug: z.string().min(1),
  name: z.string().min(1),
  brand: z.string(),
  price: z.coerce.number().min(0),
  image: z.string(),
  imageColor: z.string(),
  availability: z.enum(["in-stock", "limited", "out-of-stock"]).optional(),
  addedAt: z.coerce.number().optional(),
});

export const wishlistShareSchema = z.object({
  items: z.array(wishlistShareItemSchema).min(1).max(100),
});
