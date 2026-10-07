-- Per-user limits, referral coupons, UTM tracking, redemption audit
ALTER TABLE "coupons" ADD COLUMN IF NOT EXISTS "max_uses_per_user" INTEGER;
ALTER TABLE "coupons" ADD COLUMN IF NOT EXISTS "kind" TEXT NOT NULL DEFAULT 'standard';
ALTER TABLE "coupons" ADD COLUMN IF NOT EXISTS "referral_owner_user_id" TEXT;
ALTER TABLE "coupons" ADD COLUMN IF NOT EXISTS "referral_owner_email" TEXT;
ALTER TABLE "coupons" ADD COLUMN IF NOT EXISTS "parent_coupon_id" TEXT;
ALTER TABLE "coupons" ADD COLUMN IF NOT EXISTS "utm_source" TEXT;
ALTER TABLE "coupons" ADD COLUMN IF NOT EXISTS "utm_medium" TEXT;
ALTER TABLE "coupons" ADD COLUMN IF NOT EXISTS "utm_campaign" TEXT;
ALTER TABLE "coupons" ADD COLUMN IF NOT EXISTS "utm_content" TEXT;

CREATE INDEX IF NOT EXISTS "coupons_kind_idx" ON "coupons"("kind");
CREATE INDEX IF NOT EXISTS "coupons_referral_owner_user_id_idx" ON "coupons"("referral_owner_user_id");

CREATE TABLE IF NOT EXISTS "coupon_redemptions" (
  "id" TEXT NOT NULL,
  "coupon_id" TEXT NOT NULL,
  "coupon_code" TEXT NOT NULL,
  "user_id" TEXT,
  "customer_email" TEXT,
  "order_id" TEXT,
  "utm_source" TEXT,
  "utm_medium" TEXT,
  "utm_campaign" TEXT,
  "utm_content" TEXT,
  "created_at" TEXT NOT NULL,
  CONSTRAINT "coupon_redemptions_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "coupon_redemptions_coupon_id_user_id_idx"
  ON "coupon_redemptions"("coupon_id", "user_id");
CREATE INDEX IF NOT EXISTS "coupon_redemptions_coupon_code_customer_email_idx"
  ON "coupon_redemptions"("coupon_code", "customer_email");
CREATE INDEX IF NOT EXISTS "coupon_redemptions_order_id_idx"
  ON "coupon_redemptions"("order_id");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'coupon_redemptions_coupon_id_fkey'
  ) THEN
    ALTER TABLE "coupon_redemptions"
      ADD CONSTRAINT "coupon_redemptions_coupon_id_fkey"
      FOREIGN KEY ("coupon_id") REFERENCES "coupons"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
