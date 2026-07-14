CREATE TABLE "giveaway_campaigns" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subtitle" TEXT NOT NULL DEFAULT '',
    "description" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT 'draft',
    "prize_title" TEXT NOT NULL,
    "prize_description" TEXT NOT NULL DEFAULT '',
    "prize_image_url" TEXT,
    "product_slug" TEXT,
    "product_name" TEXT,
    "prize_value" DOUBLE PRECISION,
    "winner_count" INTEGER NOT NULL DEFAULT 1,
    "max_entries" INTEGER,
    "starts_at" TEXT NOT NULL,
    "ends_at" TEXT NOT NULL,
    "draw_at" TEXT,
    "require_login" BOOLEAN NOT NULL DEFAULT false,
    "require_email_verification" BOOLEAN NOT NULL DEFAULT true,
    "referral_bonus_entries" INTEGER NOT NULL DEFAULT 1,
    "social_bonus_entries" INTEGER NOT NULL DEFAULT 1,
    "allowed_social_platforms" JSONB NOT NULL DEFAULT '["instagram","youtube","facebook","x"]',
    "eligibility_rules" JSONB NOT NULL DEFAULT '{}',
    "terms_html" TEXT NOT NULL DEFAULT '',
    "faqs" JSONB NOT NULL DEFAULT '[]',
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "winners_announced" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TEXT NOT NULL,
    "updated_at" TEXT NOT NULL,
    CONSTRAINT "giveaway_campaigns_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "giveaway_entries" (
    "id" TEXT NOT NULL,
    "campaign_id" TEXT NOT NULL,
    "entry_number" TEXT NOT NULL,
    "user_id" TEXT,
    "email" TEXT NOT NULL,
    "customer_name" TEXT NOT NULL,
    "customer_phone" TEXT NOT NULL,
    "referral_code" TEXT NOT NULL,
    "referred_by_entry_id" TEXT,
    "social_claims" JSONB NOT NULL DEFAULT '[]',
    "base_entries" INTEGER NOT NULL DEFAULT 1,
    "bonus_entries" INTEGER NOT NULL DEFAULT 0,
    "total_entries" INTEGER NOT NULL DEFAULT 1,
    "email_verified" BOOLEAN NOT NULL DEFAULT false,
    "email_verify_token" TEXT,
    "email_verified_at" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "ip_hash" TEXT,
    "user_agent_hash" TEXT,
    "fraud_flags" JSONB NOT NULL DEFAULT '[]',
    "tracking_token" TEXT NOT NULL,
    "created_at" TEXT NOT NULL,
    "updated_at" TEXT NOT NULL,
    CONSTRAINT "giveaway_entries_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "giveaway_winners" (
    "id" TEXT NOT NULL,
    "campaign_id" TEXT NOT NULL,
    "entry_id" TEXT NOT NULL,
    "rank" INTEGER NOT NULL DEFAULT 1,
    "announced_at" TEXT,
    "notified_at" TEXT,
    "created_at" TEXT NOT NULL,
    CONSTRAINT "giveaway_winners_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "giveaway_campaign_events" (
    "id" TEXT NOT NULL,
    "campaign_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "message" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_by" TEXT,
    "created_at" TEXT NOT NULL,
    CONSTRAINT "giveaway_campaign_events_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "giveaway_campaigns_slug_key" ON "giveaway_campaigns"("slug");
CREATE INDEX "giveaway_campaigns_status_idx" ON "giveaway_campaigns"("status");
CREATE INDEX "giveaway_campaigns_starts_at_idx" ON "giveaway_campaigns"("starts_at");
CREATE INDEX "giveaway_campaigns_ends_at_idx" ON "giveaway_campaigns"("ends_at");
CREATE INDEX "giveaway_campaigns_featured_idx" ON "giveaway_campaigns"("featured");

CREATE UNIQUE INDEX "giveaway_entries_entry_number_key" ON "giveaway_entries"("entry_number");
CREATE UNIQUE INDEX "giveaway_entries_referral_code_key" ON "giveaway_entries"("referral_code");
CREATE UNIQUE INDEX "giveaway_entries_email_verify_token_key" ON "giveaway_entries"("email_verify_token");
CREATE UNIQUE INDEX "giveaway_entries_tracking_token_key" ON "giveaway_entries"("tracking_token");
CREATE UNIQUE INDEX "giveaway_entries_campaign_id_email_key" ON "giveaway_entries"("campaign_id", "email");
CREATE INDEX "giveaway_entries_campaign_id_idx" ON "giveaway_entries"("campaign_id");
CREATE INDEX "giveaway_entries_email_idx" ON "giveaway_entries"("email");
CREATE INDEX "giveaway_entries_user_id_idx" ON "giveaway_entries"("user_id");
CREATE INDEX "giveaway_entries_referral_code_idx" ON "giveaway_entries"("referral_code");
CREATE INDEX "giveaway_entries_status_idx" ON "giveaway_entries"("status");

CREATE UNIQUE INDEX "giveaway_winners_entry_id_key" ON "giveaway_winners"("entry_id");
CREATE INDEX "giveaway_winners_campaign_id_idx" ON "giveaway_winners"("campaign_id");

CREATE INDEX "giveaway_campaign_events_campaign_id_idx" ON "giveaway_campaign_events"("campaign_id");
CREATE INDEX "giveaway_campaign_events_created_at_idx" ON "giveaway_campaign_events"("created_at");

ALTER TABLE "giveaway_entries" ADD CONSTRAINT "giveaway_entries_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "giveaway_campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "giveaway_entries" ADD CONSTRAINT "giveaway_entries_referred_by_entry_id_fkey" FOREIGN KEY ("referred_by_entry_id") REFERENCES "giveaway_entries"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "giveaway_winners" ADD CONSTRAINT "giveaway_winners_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "giveaway_campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "giveaway_winners" ADD CONSTRAINT "giveaway_winners_entry_id_fkey" FOREIGN KEY ("entry_id") REFERENCES "giveaway_entries"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "giveaway_campaign_events" ADD CONSTRAINT "giveaway_campaign_events_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "giveaway_campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;
