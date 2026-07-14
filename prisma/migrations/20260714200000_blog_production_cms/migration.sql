-- Phase 6: Blog production CMS extensions

ALTER TABLE "blog_posts" ADD COLUMN "category_slug" TEXT NOT NULL DEFAULT '';
ALTER TABLE "blog_posts" ADD COLUMN "category_label" TEXT NOT NULL DEFAULT '';
ALTER TABLE "blog_posts" ADD COLUMN "featured" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "blog_posts" ADD COLUMN "author_bio" TEXT NOT NULL DEFAULT '';
ALTER TABLE "blog_posts" ADD COLUMN "author_avatar" TEXT NOT NULL DEFAULT '';
ALTER TABLE "blog_posts" ADD COLUMN "view_count" INTEGER NOT NULL DEFAULT 0;

CREATE INDEX "blog_posts_category_slug_idx" ON "blog_posts"("category_slug");
CREATE INDEX "blog_posts_featured_idx" ON "blog_posts"("featured");

CREATE TABLE "blog_comments" (
    "id" TEXT NOT NULL,
    "post_id" TEXT NOT NULL,
    "author_name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "created_at" TEXT NOT NULL,

    CONSTRAINT "blog_comments_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "blog_comments_post_id_status_idx" ON "blog_comments"("post_id", "status");

CREATE TABLE "blog_post_events" (
    "id" TEXT NOT NULL,
    "post_id" TEXT,
    "type" TEXT NOT NULL,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TEXT NOT NULL,

    CONSTRAINT "blog_post_events_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "blog_post_events_type_created_at_idx" ON "blog_post_events"("type", "created_at");
CREATE INDEX "blog_post_events_post_id_idx" ON "blog_post_events"("post_id");
