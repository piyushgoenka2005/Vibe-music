-- WRD gaps: wishlist share tokens + editable admin role permission overrides

CREATE TABLE IF NOT EXISTS "wishlist_shares" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "items" JSONB NOT NULL DEFAULT '[]',
    "user_id" TEXT,
    "view_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TEXT NOT NULL,
    "expires_at" TEXT,
    CONSTRAINT "wishlist_shares_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "wishlist_shares_token_key" ON "wishlist_shares"("token");
CREATE INDEX IF NOT EXISTS "wishlist_shares_user_id_idx" ON "wishlist_shares"("user_id");
CREATE INDEX IF NOT EXISTS "wishlist_shares_created_at_idx" ON "wishlist_shares"("created_at");

CREATE TABLE IF NOT EXISTS "admin_role_permission_overrides" (
    "role" TEXT NOT NULL,
    "permissions" JSONB NOT NULL DEFAULT '[]',
    "updated_at" TEXT NOT NULL,
    "updated_by" TEXT,
    CONSTRAINT "admin_role_permission_overrides_pkey" PRIMARY KEY ("role")
);
