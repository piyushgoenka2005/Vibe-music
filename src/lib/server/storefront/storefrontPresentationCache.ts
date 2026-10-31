import "server-only";

import { revalidatePath } from "next/cache";
import { expireStorefrontTags, purgeNginxPageCache } from "./storefrontCacheInvalidation";

/** Bust all Next.js data caches that affect the public homepage and catalog shell. */
export async function revalidateStorefrontPresentationCaches(): Promise<void> {
  expireStorefrontTags([
    "homepage",
    "catalog",
    "categories",
    "banners",
    "social-rail",
    "gear-stories",
    "blog",
    "store-settings",
    "footer-trending",
    "product-detail",
    "product-merchandising",
  ]);
  try {
    revalidatePath("/", "layout"); // root layout — refreshes header category nav, brands
    revalidatePath("/");
    revalidatePath("/", "page");
    revalidatePath("/category", "layout");
    revalidatePath("/category/[slug]", "page");
    revalidatePath("/product", "layout");
    revalidatePath("/product/[slug]", "page");
    revalidatePath("/search", "layout");
    revalidatePath("/brands", "page");
    revalidatePath("/deals", "page");
    revalidatePath("/programs", "page");
    revalidatePath("/blog", "layout");
    revalidatePath("/blog", "page");
    revalidatePath("/admin/categories", "page");
    revalidatePath("/admin/brands", "page");
    revalidatePath("/admin/homepage", "page");
    revalidatePath("/admin/blog", "page");
  } catch {
    /* ignore outside request context (CLI / workers) */
  }
  // Wait for nginx cache purge to complete (async operation)
  await purgeNginxPageCache();
}
