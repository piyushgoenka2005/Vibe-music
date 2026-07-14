import { z } from "zod";

export const compareItemSchema = z.object({
  productId: z.string().min(1),
  slug: z.string().min(1),
  name: z.string().min(1),
  brand: z.string(),
  price: z.coerce.number().min(0),
  image: z.string(),
  imageColor: z.string(),
  availability: z.enum(["in-stock", "limited", "out-of-stock"]).optional(),
  rating: z.coerce.number().min(0).optional(),
  reviewCount: z.coerce.number().min(0).optional(),
  addedAt: z.coerce.number().optional(),
});

export const compareListSchema = z.object({
  items: z.array(compareItemSchema).max(4),
});

export const compareShareSchema = z.object({
  items: z.array(compareItemSchema).max(4).optional(),
});
