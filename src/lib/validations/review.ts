import { z } from "zod";

const cloudinaryUrl = z
  .string()
  .url()
  .refine(
    (url) => url.includes("res.cloudinary.com") || url.startsWith("https://"),
    "Invalid image URL"
  );

export const createReviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  title: z.string().trim().min(1).max(120),
  body: z.string().trim().min(20).max(2000),
  images: z.array(cloudinaryUrl).max(5).optional().default([]),
});

export const reviewListQuerySchema = z.object({
  sort: z
    .enum(["newest", "oldest", "highest", "lowest", "helpful"])
    .optional()
    .default("newest"),
  rating: z.coerce.number().int().min(1).max(5).optional(),
  verified: z
    .enum(["true", "false"])
    .optional()
    .transform((v) => (v === "true" ? true : v === "false" ? false : undefined)),
  hasImages: z
    .enum(["true", "false"])
    .optional()
    .transform((v) => (v === "true" ? true : v === "false" ? false : undefined)),
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(20).optional().default(10),
});

export const adminReviewListQuerySchema = reviewListQuerySchema.extend({
  status: z.preprocess(
    (value) => (value === "" || value === null || value === undefined ? undefined : value),
    z.enum(["pending", "approved", "rejected"]).optional()
  ),
  productId: z.preprocess(
    (value) => (value === "" || value === null || value === undefined ? undefined : value),
    z.string().optional()
  ),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
});

export const adminReviewStatusSchema = z.object({
  status: z.enum(["pending", "approved", "rejected"]),
  adminReply: z.string().max(2000).optional(),
  rejectionReason: z.string().max(500).optional(),
});

export const reviewUploadBodySchema = z.object({
  productId: z.string().min(1),
});
