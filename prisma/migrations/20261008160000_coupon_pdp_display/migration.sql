-- Product-page coupon display + percentage discount cap (admin-controlled).
ALTER TABLE "coupons" ADD COLUMN IF NOT EXISTS "max_discount_amount" DOUBLE PRECISION;
ALTER TABLE "coupons" ADD COLUMN IF NOT EXISTS "pdp_headline" TEXT;
ALTER TABLE "coupons" ADD COLUMN IF NOT EXISTS "pdp_offer_line" TEXT;
ALTER TABLE "coupons" ADD COLUMN IF NOT EXISTS "pdp_max_discount_line" TEXT;
ALTER TABLE "coupons" ADD COLUMN IF NOT EXISTS "pdp_terms_line" TEXT;
ALTER TABLE "coupons" ADD COLUMN IF NOT EXISTS "pdp_disclaimer" TEXT;
ALTER TABLE "coupons" ADD COLUMN IF NOT EXISTS "pdp_footer" TEXT;
