-- Durable waitlist for Notify Me / restock emails

CREATE TABLE IF NOT EXISTS "product_stock_alerts" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "product_slug" TEXT NOT NULL,
    "product_name" TEXT NOT NULL,
    "user_id" TEXT,
    "created_at" TEXT NOT NULL,
    "notified_at" TEXT,
    CONSTRAINT "product_stock_alerts_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "product_stock_alerts_email_product_id_key"
  ON "product_stock_alerts"("email", "product_id");
CREATE INDEX IF NOT EXISTS "product_stock_alerts_product_id_notified_at_idx"
  ON "product_stock_alerts"("product_id", "notified_at");
