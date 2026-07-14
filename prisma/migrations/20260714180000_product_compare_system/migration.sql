CREATE TABLE "product_compare_lists" (
    "user_id" TEXT NOT NULL,
    "items" JSONB NOT NULL DEFAULT '[]',
    "updated_at" TEXT NOT NULL,
    CONSTRAINT "product_compare_lists_pkey" PRIMARY KEY ("user_id")
);

CREATE TABLE "product_compare_shares" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "items" JSONB NOT NULL DEFAULT '[]',
    "user_id" TEXT,
    "view_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TEXT NOT NULL,
    "expires_at" TEXT,
    CONSTRAINT "product_compare_shares_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "product_compare_events" (
    "id" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "user_id" TEXT,
    "product_id" TEXT,
    "share_token" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TEXT NOT NULL,
    CONSTRAINT "product_compare_events_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "product_compare_shares_token_key" ON "product_compare_shares"("token");
CREATE INDEX "product_compare_shares_user_id_idx" ON "product_compare_shares"("user_id");
CREATE INDEX "product_compare_shares_created_at_idx" ON "product_compare_shares"("created_at");
CREATE INDEX "product_compare_events_event_type_idx" ON "product_compare_events"("event_type");
CREATE INDEX "product_compare_events_created_at_idx" ON "product_compare_events"("created_at");

ALTER TABLE "product_compare_lists" ADD CONSTRAINT "product_compare_lists_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("uid") ON DELETE CASCADE ON UPDATE CASCADE;
