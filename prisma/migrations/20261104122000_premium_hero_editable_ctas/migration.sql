ALTER TABLE "homepage_sections"
ADD COLUMN IF NOT EXISTS "secondary_cta_text" TEXT,
ADD COLUMN IF NOT EXISTS "secondary_cta_link" TEXT;
