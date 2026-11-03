-- CreateTable
CREATE TABLE IF NOT EXISTS "navigation_menus" (
    "id" TEXT NOT NULL,
    "handle" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TEXT NOT NULL,
    "updated_at" TEXT NOT NULL,

    CONSTRAINT "navigation_menus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "navigation_menu_items" (
    "id" TEXT NOT NULL,
    "menu_id" TEXT NOT NULL,
    "parent_id" TEXT,
    "label" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "category_id" TEXT,
    "icon" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "item_type" TEXT NOT NULL DEFAULT 'link',
    "mega_menu_data" JSONB,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "visible_desktop" BOOLEAN NOT NULL DEFAULT true,
    "visible_mobile" BOOLEAN NOT NULL DEFAULT true,
    "open_in_new_tab" BOOLEAN NOT NULL DEFAULT false,
    "badge_text" TEXT,
    "created_at" TEXT NOT NULL,
    "updated_at" TEXT NOT NULL,

    CONSTRAINT "navigation_menu_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "header_settings" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "logo_asset" TEXT,
    "search_visibility" BOOLEAN NOT NULL DEFAULT true,
    "search_placeholder" TEXT NOT NULL DEFAULT 'Search for guitars, keyboards, microphones and more...',
    "profile_visibility" BOOLEAN NOT NULL DEFAULT true,
    "profile_destination" TEXT NOT NULL DEFAULT '/account',
    "wishlist_visibility" BOOLEAN NOT NULL DEFAULT true,
    "wishlist_destination" TEXT NOT NULL DEFAULT '/account/wishlist',
    "cart_visibility" BOOLEAN NOT NULL DEFAULT true,
    "cart_destination" TEXT NOT NULL DEFAULT '/cart',
    "utility_bar_active" BOOLEAN NOT NULL DEFAULT true,
    "shipping_announcement" TEXT,
    "shipping_threshold" DOUBLE PRECISION,
    "updated_at" TEXT NOT NULL,

    CONSTRAINT "header_settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "navigation_menus_handle_key" ON "navigation_menus"("handle");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "navigation_menu_items_menu_id_idx" ON "navigation_menu_items"("menu_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "navigation_menu_items_parent_id_idx" ON "navigation_menu_items"("parent_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "navigation_menu_items_sort_order_idx" ON "navigation_menu_items"("sort_order");

-- AddForeignKey
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'navigation_menu_items_menu_id_fkey'
    ) THEN
        ALTER TABLE "navigation_menu_items" ADD CONSTRAINT "navigation_menu_items_menu_id_fkey" FOREIGN KEY ("menu_id") REFERENCES "navigation_menus"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'navigation_menu_items_parent_id_fkey'
    ) THEN
        ALTER TABLE "navigation_menu_items" ADD CONSTRAINT "navigation_menu_items_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "navigation_menu_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;
