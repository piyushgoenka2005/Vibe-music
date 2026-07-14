-- CreateTable
CREATE TABLE "rental_categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "image_url" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'active',
    "meta_title" TEXT,
    "meta_description" TEXT,
    "created_at" TEXT NOT NULL,
    "updated_at" TEXT NOT NULL,

    CONSTRAINT "rental_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rental_products" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category_id" TEXT NOT NULL,
    "catalog_product_id" TEXT,
    "description" TEXT NOT NULL DEFAULT '',
    "image" TEXT NOT NULL DEFAULT '',
    "images" JSONB NOT NULL DEFAULT '[]',
    "specifications" JSONB NOT NULL DEFAULT '{}',
    "status" TEXT NOT NULL DEFAULT 'active',
    "total_units" INTEGER NOT NULL DEFAULT 1,
    "available_units" INTEGER NOT NULL DEFAULT 1,
    "reserved_units" INTEGER NOT NULL DEFAULT 0,
    "min_duration_hours" INTEGER NOT NULL DEFAULT 24,
    "max_duration_days" INTEGER NOT NULL DEFAULT 30,
    "deposit_amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "hourly_rate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "daily_rate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "weekly_rate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "monthly_rate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "pickup_available" BOOLEAN NOT NULL DEFAULT true,
    "delivery_available" BOOLEAN NOT NULL DEFAULT true,
    "delivery_fee" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "pickup_fee" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "late_fee_per_day" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "damage_policy" TEXT NOT NULL DEFAULT '',
    "terms_text" TEXT NOT NULL DEFAULT '',
    "agreement_text" TEXT NOT NULL DEFAULT '',
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TEXT NOT NULL,
    "updated_at" TEXT NOT NULL,

    CONSTRAINT "rental_products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rental_inventory_units" (
    "id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "serial_number" TEXT,
    "label" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT 'available',
    "created_at" TEXT NOT NULL,
    "updated_at" TEXT NOT NULL,

    CONSTRAINT "rental_inventory_units_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rental_availability_blocks" (
    "id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "unit_id" TEXT,
    "start_at" TEXT NOT NULL,
    "end_at" TEXT NOT NULL,
    "reason" TEXT NOT NULL DEFAULT 'maintenance',
    "created_at" TEXT NOT NULL,

    CONSTRAINT "rental_availability_blocks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rental_bookings" (
    "id" TEXT NOT NULL,
    "booking_number" TEXT NOT NULL,
    "user_id" TEXT,
    "email" TEXT NOT NULL,
    "customer_name" TEXT NOT NULL,
    "customer_phone" TEXT NOT NULL,
    "is_guest" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "payment_status" TEXT NOT NULL DEFAULT 'pending',
    "payment_method" TEXT,
    "duration_type" TEXT NOT NULL,
    "start_at" TEXT NOT NULL,
    "end_at" TEXT NOT NULL,
    "fulfillment" TEXT NOT NULL DEFAULT 'pickup',
    "address" JSONB,
    "subtotal" DOUBLE PRECISION NOT NULL,
    "deposit_amount" DOUBLE PRECISION NOT NULL,
    "delivery_fee" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "pickup_fee" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "total_gst" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "total" DOUBLE PRECISION NOT NULL,
    "late_fees" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "damage_charges" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "refund_amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "agreement_accepted_at" TEXT,
    "terms_accepted_at" TEXT,
    "razorpay_order_id" TEXT,
    "razorpay_payment_id" TEXT,
    "razorpay_signature" TEXT,
    "tracking_token" TEXT,
    "cancelled_at" TEXT,
    "cancellation_reason" TEXT,
    "returned_at" TEXT,
    "notes" TEXT,
    "created_at" TEXT NOT NULL,
    "updated_at" TEXT NOT NULL,

    CONSTRAINT "rental_bookings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rental_booking_items" (
    "id" TEXT NOT NULL,
    "booking_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "product_name" TEXT NOT NULL,
    "product_slug" TEXT NOT NULL,
    "unit_id" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "duration_type" TEXT NOT NULL,
    "duration_units" DOUBLE PRECISION NOT NULL,
    "unit_rate" DOUBLE PRECISION NOT NULL,
    "line_subtotal" DOUBLE PRECISION NOT NULL,
    "deposit_amount" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "rental_booking_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rental_inventory_locks" (
    "id" TEXT NOT NULL,
    "unit_id" TEXT,
    "product_id" TEXT NOT NULL,
    "booking_id" TEXT NOT NULL,
    "start_at" TEXT NOT NULL,
    "end_at" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'held',
    "expires_at" TEXT,
    "created_at" TEXT NOT NULL,

    CONSTRAINT "rental_inventory_locks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rental_charges" (
    "id" TEXT NOT NULL,
    "booking_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "created_by" TEXT,
    "created_at" TEXT NOT NULL,

    CONSTRAINT "rental_charges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rental_status_events" (
    "id" TEXT NOT NULL,
    "booking_id" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "note" TEXT,
    "created_by" TEXT,
    "created_at" TEXT NOT NULL,

    CONSTRAINT "rental_status_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rental_policies" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "title" TEXT NOT NULL DEFAULT 'Rental Terms',
    "terms_html" TEXT NOT NULL DEFAULT '',
    "agreement_html" TEXT NOT NULL DEFAULT '',
    "cancellation_policy" TEXT NOT NULL DEFAULT '',
    "late_fee_policy" TEXT NOT NULL DEFAULT '',
    "damage_policy" TEXT NOT NULL DEFAULT '',
    "updated_at" TEXT NOT NULL,

    CONSTRAINT "rental_policies_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "rental_categories_slug_key" ON "rental_categories"("slug");
CREATE INDEX "rental_categories_status_idx" ON "rental_categories"("status");
CREATE UNIQUE INDEX "rental_products_slug_key" ON "rental_products"("slug");
CREATE INDEX "rental_products_category_id_idx" ON "rental_products"("category_id");
CREATE INDEX "rental_products_status_idx" ON "rental_products"("status");
CREATE INDEX "rental_products_featured_idx" ON "rental_products"("featured");
CREATE INDEX "rental_inventory_units_product_id_idx" ON "rental_inventory_units"("product_id");
CREATE INDEX "rental_inventory_units_status_idx" ON "rental_inventory_units"("status");
CREATE INDEX "rental_availability_blocks_product_id_idx" ON "rental_availability_blocks"("product_id");
CREATE INDEX "rental_availability_blocks_start_at_idx" ON "rental_availability_blocks"("start_at");
CREATE INDEX "rental_availability_blocks_end_at_idx" ON "rental_availability_blocks"("end_at");
CREATE UNIQUE INDEX "rental_bookings_booking_number_key" ON "rental_bookings"("booking_number");
CREATE INDEX "rental_bookings_user_id_idx" ON "rental_bookings"("user_id");
CREATE INDEX "rental_bookings_email_idx" ON "rental_bookings"("email");
CREATE INDEX "rental_bookings_status_idx" ON "rental_bookings"("status");
CREATE INDEX "rental_bookings_payment_status_idx" ON "rental_bookings"("payment_status");
CREATE INDEX "rental_bookings_start_at_idx" ON "rental_bookings"("start_at");
CREATE INDEX "rental_bookings_created_at_idx" ON "rental_bookings"("created_at");
CREATE INDEX "rental_booking_items_booking_id_idx" ON "rental_booking_items"("booking_id");
CREATE INDEX "rental_booking_items_product_id_idx" ON "rental_booking_items"("product_id");
CREATE INDEX "rental_inventory_locks_product_id_idx" ON "rental_inventory_locks"("product_id");
CREATE INDEX "rental_inventory_locks_booking_id_idx" ON "rental_inventory_locks"("booking_id");
CREATE INDEX "rental_inventory_locks_start_at_idx" ON "rental_inventory_locks"("start_at");
CREATE INDEX "rental_inventory_locks_end_at_idx" ON "rental_inventory_locks"("end_at");
CREATE INDEX "rental_inventory_locks_status_idx" ON "rental_inventory_locks"("status");
CREATE INDEX "rental_charges_booking_id_idx" ON "rental_charges"("booking_id");
CREATE INDEX "rental_status_events_booking_id_idx" ON "rental_status_events"("booking_id");
CREATE INDEX "rental_status_events_created_at_idx" ON "rental_status_events"("created_at");

-- AddForeignKey
ALTER TABLE "rental_products" ADD CONSTRAINT "rental_products_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "rental_categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "rental_inventory_units" ADD CONSTRAINT "rental_inventory_units_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "rental_products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "rental_availability_blocks" ADD CONSTRAINT "rental_availability_blocks_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "rental_products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "rental_booking_items" ADD CONSTRAINT "rental_booking_items_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "rental_bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "rental_booking_items" ADD CONSTRAINT "rental_booking_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "rental_products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "rental_inventory_locks" ADD CONSTRAINT "rental_inventory_locks_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "rental_bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "rental_inventory_locks" ADD CONSTRAINT "rental_inventory_locks_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "rental_products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "rental_inventory_locks" ADD CONSTRAINT "rental_inventory_locks_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "rental_inventory_units"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "rental_charges" ADD CONSTRAINT "rental_charges_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "rental_bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "rental_status_events" ADD CONSTRAINT "rental_status_events_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "rental_bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
