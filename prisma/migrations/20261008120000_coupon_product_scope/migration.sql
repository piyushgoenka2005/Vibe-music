-- Per-product coupon scope (admin-controlled productIds on each coupon)
ALTER TABLE "coupons" ADD COLUMN IF NOT EXISTS "scope" TEXT NOT NULL DEFAULT 'store';
ALTER TABLE "coupons" ADD COLUMN IF NOT EXISTS "product_ids" JSONB NOT NULL DEFAULT '[]';
