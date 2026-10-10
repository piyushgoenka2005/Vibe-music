import "server-only";

import { revalidatePath, revalidateTag } from "next/cache";

/** Bust all Next.js data caches that affect the public homepage and catalog shell. */
export function revalidateStorefrontPresentationCaches(): void {
  try {
    revalidateTag("homepage", "max");
    revalidateTag("catalog", "max");
    revalidateTag("categories", "max");
    revalidateTag("banners", "max");
    revalidateTag("social-rail", "max");
    revalidateTag("gear-stories", "max");
    revalidatePath("/");
    revalidatePath("/category", "layout");
    revalidatePath("/product", "layout");
    revalidatePath("/search", "layout");
  } catch {
    /* ignore outside request context (CLI / workers) */
  }
}
