-- Master catalog taxonomy (admin import / product classification)
CREATE TABLE "catalog_taxonomies" (
    "id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "subcategory" TEXT NOT NULL,
    "variant" TEXT,
    "product_type" TEXT NOT NULL,
    "instrument_family" TEXT,
    "seo_slug" TEXT NOT NULL,
    "google_product_category" TEXT,
    "menu_level_1" TEXT,
    "menu_level_2" TEXT,
    "menu_level_3" TEXT,
    "created_at" TEXT,
    "updated_at" TEXT,

    CONSTRAINT "catalog_taxonomies_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "catalog_taxonomies_category_idx" ON "catalog_taxonomies"("category");
CREATE INDEX "catalog_taxonomies_subcategory_idx" ON "catalog_taxonomies"("subcategory");
CREATE INDEX "catalog_taxonomies_seo_slug_idx" ON "catalog_taxonomies"("seo_slug");
CREATE INDEX "catalog_taxonomies_product_type_idx" ON "catalog_taxonomies"("product_type");
CREATE INDEX "catalog_taxonomies_menu_level_1_idx" ON "catalog_taxonomies"("menu_level_1");
