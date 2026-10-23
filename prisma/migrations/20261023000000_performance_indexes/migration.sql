-- Performance indexes for admin query patterns
-- Admin products list: search, status, category, stock filters + cursor pagination
CREATE INDEX IF NOT EXISTS "products_admin_list_idx" 
ON "products" ("status", "categorySlug", "createdAt" DESC, "id" DESC)
WHERE "status" IN ('active', 'draft', 'archived');

-- Admin products search: name, brand, slug, sku (partial index for active products)
CREATE INDEX IF NOT EXISTS "products_admin_search_idx" 
ON "products" ("name" text_pattern_ops, "brand" text_pattern_ops, "slug" text_pattern_ops, "sku" text_pattern_ops)
WHERE "status" = 'active';

-- Admin products stock filters
CREATE INDEX IF NOT EXISTS "products_stock_filter_idx" 
ON "products" ("stock", "lowStockThreshold", "status")
WHERE "status" = 'active';

-- Admin orders list: status, createdAt desc, cursor pagination
CREATE INDEX IF NOT EXISTS "orders_admin_list_idx" 
ON "orders" ("status", "createdAt" DESC, "id" DESC);

-- Admin orders search by email, userId
CREATE INDEX IF NOT EXISTS "orders_admin_search_idx" 
ON "orders" ("email" text_pattern_ops, "userId" text_pattern_ops);

-- Admin dashboard: paid revenue aggregates
CREATE INDEX IF NOT EXISTS "orders_paid_revenue_idx" 
ON "orders" ("paymentStatus", "createdAt" DESC, "total")
WHERE "paymentStatus" = 'paid';

-- Admin customers list: createdAt desc
CREATE INDEX IF NOT EXISTS "users_admin_list_idx" 
ON "users" ("createdAt" DESC);

-- Admin reviews list: productId, status, createdAt
CREATE INDEX IF NOT EXISTS "reviews_admin_list_idx" 
ON "reviews" ("productId", "status", "createdAt" DESC);

-- Admin coupons list: isActive, createdAt
CREATE INDEX IF NOT EXISTS "coupons_admin_list_idx" 
ON "coupons" ("isActive", "createdAt" DESC);

-- Admin banners list: status, priority, startDate
CREATE INDEX IF NOT EXISTS "banners_admin_list_idx" 
ON "banners" ("status", "priority", "startDate" DESC);

-- Admin blog posts: status, createdAt
CREATE INDEX IF NOT EXISTS "blog_posts_admin_list_idx" 
ON "blog_posts" ("status", "createdAt" DESC);

-- Inventory logs: productId, createdAt for audit trail
CREATE INDEX IF NOT EXISTS "inventory_log_product_idx" 
ON "inventory_log" ("productId", "createdAt" DESC);

-- Product relations: productId for related products
CREATE INDEX IF NOT EXISTS "product_relation_source_idx" 
ON "product_relation" ("productId");

-- Product bundles: productId
CREATE INDEX IF NOT EXISTS "product_bundle_product_idx" 
ON "product_bundle" ("productId");

-- Product review stats: productId
CREATE INDEX IF NOT EXISTS "product_review_stats_product_idx" 
ON "product_review_stats" ("productId");

-- Shipment: orderId
CREATE INDEX IF NOT EXISTS "shipment_order_idx" 
ON "shipment" ("orderId");

-- Tracking events: orderId, createdAt
CREATE INDEX IF NOT EXISTS "tracking_event_order_idx" 
ON "tracking_events" ("orderId", "createdAt" DESC);

-- Return requests: orderId, status
CREATE INDEX IF NOT EXISTS "return_request_order_idx" 
ON "return_requests" ("orderId", "status");

-- Admin notifications: userId, read, createdAt
CREATE INDEX IF NOT EXISTS "admin_notification_user_idx" 
ON "admin_notifications" ("userId", "read", "createdAt" DESC);

-- Support tickets: userId, status, createdAt
CREATE INDEX IF NOT EXISTS "support_ticket_user_idx" 
ON "support_tickets" ("userId", "status", "createdAt" DESC);

-- Newsletter subscribers: email, subscribedAt
CREATE INDEX IF NOT EXISTS "newsletter_subscriber_email_idx" 
ON "newsletter_subscriber" ("email");

-- Product stock alerts: productId, notified
CREATE INDEX IF NOT EXISTS "product_stock_alert_product_idx" 
ON "product_stock_alert" ("productId", "notified");

-- Homepage section items: sectionKey, sortOrder
CREATE INDEX IF NOT EXISTS "homepage_section_item_section_idx" 
ON "homepage_section_items" ("sectionKey", "sortOrder");

-- Product questions: productId, status
CREATE INDEX IF NOT EXISTS "product_question_product_idx" 
ON "product_questions" ("productId", "status");

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
ON "orders" ("status", "email" text_pattern_ops, "createdAt" DESC);

-- Index for admin products by category and status (common filter combo)
CREATE INDEX IF NOT EXISTS "products_admin_category_status_idx" 
ON "products" ("categorySlug", "status", "createdAt" DESC, "id" DESC);

-- Index for low stock queries
CREATE INDEX IF NOT EXISTS "products_low_stock_idx" 
ON "products" ("lowStockThreshold", "stock", "status")
WHERE "status" = 'active' AND "lowStockThreshold" IS NOT NULL;

-- Index for featured/trending products
CREATE INDEX IF NOT EXISTS "products_featured_trending_idx" 
ON "products" ("featured", "trending", "newArrival", "status", "createdAt" DESC)
WHERE "status" = 'active';