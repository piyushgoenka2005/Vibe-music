-- CreateTable
CREATE TABLE "media_assets" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'image',
    "format" TEXT NOT NULL,
    "size_kb" INTEGER NOT NULL,
    "dimensions" TEXT,
    "category" TEXT NOT NULL DEFAULT 'uploads',
    "product_sku" TEXT,
    "created_at" TEXT NOT NULL,

    CONSTRAINT "media_assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tax_categories" (
    "hsn_code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "gst_rate" INTEGER NOT NULL,
    "cgst_rate" INTEGER NOT NULL,
    "sgst_rate" INTEGER NOT NULL,
    "igst_rate" INTEGER NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "item_count" INTEGER NOT NULL DEFAULT 0,
    "updated_at" TEXT NOT NULL,

    CONSTRAINT "tax_categories_pkey" PRIMARY KEY ("hsn_code")
);

-- CreateTable
CREATE TABLE "localization_settings" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "currencies" JSONB NOT NULL DEFAULT '[]',
    "locales" JSONB NOT NULL DEFAULT '[]',
    "preferences" JSONB NOT NULL DEFAULT '{}',
    "updated_at" TEXT NOT NULL,

    CONSTRAINT "localization_settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "media_assets_category_idx" ON "media_assets"("category");

-- CreateIndex
CREATE INDEX "media_assets_created_at_idx" ON "media_assets"("created_at");
