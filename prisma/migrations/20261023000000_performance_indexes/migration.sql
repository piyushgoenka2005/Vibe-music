-- Performance indexes for admin query patterns
-- Admin products list: search, status, category, stock filters + cursor pagination
CREATE INDEX IF NOT EXISTS "products_admin_list_idx" 
ON "products" ("status", "category_slug", "created_at" DESC, "id" DESC)
WHERE "status" IN ('active', 'draft', 'archived');

-- Admin products search: name, brand, slug, sku (partial index for active products)
CREATE INDEX IF NOT EXISTS "products_admin_search_idx" 
ON "products" ("name" text_pattern_ops, "brand" text_pattern_ops, "slug" text_pattern_ops, "sku" text_pattern_ops)
WHERE "status" = 'active';

-- Admin products stock filters
CREATE INDEX IF NOT EXISTS "products_stock_filter_idx" 
ON "products" ("stock", "low_stock_threshold", "status")
WHERE "status" = 'active';

-- Admin orders list: status, created_at desc, cursor pagination
CREATE INDEX IF NOT EXISTS "orders_admin_list_idx" 
ON "orders" ("status", "created_at" DESC, "id" DESC);

-- Admin orders search by email, user_id
CREATE INDEX IF NOT EXISTS "orders_admin_search_idx" 
ON "orders" ("email" text_pattern_ops, "user_id" text_pattern_ops);

-- Admin dashboard: paid revenue aggregates
CREATE INDEX IF NOT EXISTS "orders_paid_revenue_idx" 
ON "orders" ("payment_status", "created_at" DESC, "total")
WHERE "payment_status" = 'paid';

-- Admin customers list: created_at desc
CREATE INDEX IF NOT EXISTS "users_admin_list_idx" 
ON "users" ("created_at" DESC);

-- Admin reviews list: product_id, status, created_at
CREATE INDEX IF NOT EXISTS "reviews_admin_list_idx" 
ON "reviews" ("product_id", "status", "created_at" DESC);

-- Admin coupons list: is_active, created_at
CREATE INDEX IF NOT EXISTS "coupons_admin_list_idx" 
ON "coupons" ("is_active", "created_at" DESC);

-- Admin banners list: status, priority, start_date
CREATE INDEX IF NOT EXISTS "banners_admin_list_idx" 
ON "banners" ("status", "priority", "start_date" DESC);

-- Admin blog posts: status, created_at
CREATE INDEX IF NOT EXISTS "blog_posts_admin_list_idx" 
ON "blog_posts" ("status", "created_at" DESC);

-- Inventory logs: product_id, timestamp for audit trail
CREATE INDEX IF NOT EXISTS "inventory_log_product_idx" 
ON "inventory_logs" ("product_id", "timestamp" DESC);

-- Product relations: product_id for related products
CREATE INDEX IF NOT EXISTS "product_relation_source_idx" 
ON "product_relations" ("product_id");

-- Product bundles: product_id
CREATE INDEX IF NOT EXISTS "product_bundle_product_idx" 
ON "product_bundles" ("product_id");

-- Product review stats: product_id
CREATE INDEX IF NOT EXISTS "product_review_stats_product_idx" 
ON "product_review_stats" ("product_id");

-- Shipment: order_id
CREATE INDEX IF NOT EXISTS "shipment_order_idx" 
ON "shipments" ("order_id");

-- Tracking events: order_id, created_at
CREATE INDEX IF NOT EXISTS "tracking_event_order_idx" 
ON "tracking_events" ("order_id", "created_at" DESC);

-- Return requests: order_id, status
CREATE INDEX IF NOT EXISTS "return_request_order_idx" 
ON "return_requests" ("order_id", "status");

-- Admin notifications: read, created_at
CREATE INDEX IF NOT EXISTS "admin_notification_user_idx" 
ON "admin_notifications" ("read", "created_at" DESC);

-- Support tickets: user_id, status, created_at
CREATE INDEX IF NOT EXISTS "support_ticket_user_idx" 
ON "support_tickets" ("user_id", "status", "created_at" DESC);

-- Newsletter subscribers: email
CREATE INDEX IF NOT EXISTS "newsletter_subscriber_email_idx" 
ON "newsletter_subscribers" ("email");

-- Product stock alerts: product_id, notified_at
CREATE INDEX IF NOT EXISTS "product_stock_alert_product_idx" 
ON "product_stock_alerts" ("product_id", "notified_at");

-- Homepage section items: section_key, sort_order
CREATE INDEX IF NOT EXISTS "homepage_section_item_section_idx" 
ON "homepage_section_items" ("section_key", "sort_order");

-- Product questions: product_id, status
CREATE INDEX IF NOT EXISTS "product_question_product_idx" 
ON "product_questions" ("product_id", "status");

-- Full-text search index for product search (PostgreSQL GIN index)
-- This enables fast text search queries using to_tsvector
CREATE INDEX IF NOT EXISTS "products_search_fts_idx" 
ON "products" USING GIN (
  to_tsvector('english', 
    coalesce("name", '') || ' ' || 
    coalesce("brand", '') || ' ' || 
    coalesce("slug", '') || ' ' || 
    coalesce("sku", '') || ' ' || 
    coalesce("category", '') || ' ' || 
    coalesce("subcategory", '')
  )
) WHERE "status" = 'active';

-- Composite index for admin orders with search
CREATE INDEX IF NOT EXISTS "orders_admin_search_composite_idx" 
ON "orders" ("status", "email" text_pattern_ops, "created_at" DESC);

-- Index for admin products by category and status (common filter combo)
CREATE INDEX IF NOT EXISTS "products_admin_category_status_idx" 
ON "products" ("category_slug", "status", "created_at" DESC, "id" DESC);

-- Index for low stock queries
CREATE INDEX IF NOT EXISTS "products_low_stock_idx" 
ON "products" ("low_stock_threshold", "stock", "status")
WHERE "status" = 'active' AND "low_stock_threshold" IS NOT NULL;

-- Index for featured/trending products
CREATE INDEX IF NOT EXISTS "products_featured_trending_idx" 
ON "products" ("featured", "trending", "new_arrival", "status", "created_at" DESC)
WHERE "status" = 'active';