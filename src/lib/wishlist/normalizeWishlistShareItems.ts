import type { WishlistShareItem } from "@/types/wishlist";

const AVAILABILITIES = new Set(["in-stock", "limited", "out-of-stock"]);

function asAvailability(
  value: unknown
): WishlistShareItem["availability"] | undefined {
  if (typeof value !== "string") return undefined;
  return AVAILABILITIES.has(value)
    ? (value as WishlistShareItem["availability"])
    : undefined;
}

export function normalizeWishlistShareItems(
  raw: unknown
): WishlistShareItem[] {
  if (!Array.isArray(raw)) return [];

  const seen = new Set<string>();
  const items: WishlistShareItem[] = [];

  for (const entry of raw) {
    if (!entry || typeof entry !== "object") continue;
    const row = entry as Record<string, unknown>;
    const productId = typeof row.productId === "string" ? row.productId.trim() : "";
    const slug = typeof row.slug === "string" ? row.slug.trim() : "";
    const name = typeof row.name === "string" ? row.name.trim() : "";
    if (!productId || !slug || !name || seen.has(productId)) continue;
    seen.add(productId);

    items.push({
      productId,
      slug,
      name,
      brand: typeof row.brand === "string" ? row.brand : "",
      price: typeof row.price === "number" && Number.isFinite(row.price) ? row.price : 0,
      image: typeof row.image === "string" ? row.image : "",
      imageColor: typeof row.imageColor === "string" ? row.imageColor : "#e5e5e5",
      availability: asAvailability(row.availability),
      addedAt:
        typeof row.addedAt === "number" && Number.isFinite(row.addedAt)
          ? row.addedAt
          : Date.now(),
    });
  }

  return items;
}
