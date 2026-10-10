import "server-only";

import { revalidatePath } from "next/cache";
import { expireStorefrontTags, purgeNginxPageCache } from "./storefrontCacheInvalidation";

/** Bust all Next.js data caches that affect the public homepage and catalog shell. */
export function revalidateStorefrontPresentationCaches(): void {
  expireStorefrontTags([
    "homepage",
    "catalog",
    "categories",
    "banners",
    "social-rail",
    "gear-stories",
  ]);
  try {
    revalidatePath("/");
    revalidatePath("/category", "layout");
    revalidatePath("/product", "layout");
    revalidatePath("/search", "layout");
  } catch {
    /* ignore outside request context (CLI / workers) */
  }
  void purgeNginxPageCache();
}
