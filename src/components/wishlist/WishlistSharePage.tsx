"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import StorefrontThumbImage from "@/components/common/StorefrontThumbImage";
import { ROUTES } from "@/lib/routes";
import { formatDisplayPrice } from "@/utils/currency";
import { useWishlistStore } from "@/store/wishlistStore";
import { useToastStore } from "@/store/toastStore";
import type { WishlistShareItem } from "@/types/wishlist";
import type { Product } from "@/types/product";

function toProduct(item: WishlistShareItem): Product {
  return {
    id: item.productId,
    slug: item.slug,
    name: item.name,
    brand: item.brand,
    brandSlug: item.brand.toLowerCase().replace(/\s+/g, "-"),
    category: "",
    categorySlug: "",
    price: item.price,
    rating: 0,
    reviewCount: 0,
    availability: item.availability ?? "in-stock",
    condition: "new",
    imageColor: item.imageColor,
    image: item.image,
  };
}

export default function WishlistSharePage({ token }: { token: string }) {
  const add = useWishlistStore((s) => s.add);
  const has = useWishlistStore((s) => s.has);
  const showToast = useToastStore((s) => s.show);

  const { data, isLoading, error } = useQuery({
    queryKey: ["wishlist-share", token],
    queryFn: async () => {
      const res = await fetch(`/api/wishlist/share/${token}`);
      if (!res.ok) throw new Error("Shared wishlist not found");
      return res.json() as Promise<{ share: { items: WishlistShareItem[] } }>;
    },
  });

  if (isLoading) {
    return (
      <main className="storefront-page">
        <div className="acct__card" style={{ maxWidth: 960, margin: "2rem auto" }}>
          <h1 className="acct__section-title">Shared wishlist</h1>
          <p>Loading shared wishlist…</p>
        </div>
      </main>
    );
  }

  if (error || !data?.share.items.length) {
    return (
      <main className="storefront-page">
        <div className="acct__card" style={{ maxWidth: 960, margin: "2rem auto" }}>
          <h1 className="acct__section-title">Shared wishlist</h1>
          <p>This shared wishlist was not found or has expired.</p>
          <Link href={ROUTES.search} className="acct__btn acct__btn--primary">
            Browse products
          </Link>
        </div>
      </main>
    );
  }

  const items = data.share.items;

  function saveAll() {
    let added = 0;
    for (const item of items) {
      if (!has(item.productId)) {
        add(toProduct(item));
        added += 1;
      }
    }
    showToast(
      added > 0
        ? `Added ${added} item${added === 1 ? "" : "s"} to your wishlist`
        : "All items already in your wishlist",
      added > 0 ? "success" : "info"
    );
  }

  return (
    <main className="storefront-page">
      <div style={{ maxWidth: 960, margin: "2rem auto", padding: "0 1rem" }}>
        <h1 className="acct__section-title">Shared wishlist</h1>
        <p className="acct__section-sub">
          {items.length} item{items.length === 1 ? "" : "s"} shared from a Vibe Music wishlist.
        </p>

        <div className="acct__toolbar">
          <button
            type="button"
            className="acct__btn acct__btn--primary"
            onClick={saveAll}
          >
            Save all to my wishlist
          </button>
          <Link href={ROUTES.accountWishlist} className="acct__btn acct__btn--secondary">
            Open my wishlist
          </Link>
        </div>

        <div className="acct__wishlist-grid">
          {items.map((item) => (
            <article key={item.productId} className="acct__wishlist-card">
              <div className="acct__wishlist-img">
                {item.image ? (
                  <StorefrontThumbImage
                    src={item.image}
                    alt={item.name}
                    width={120}
                    height={120}
                  />
                ) : (
                  <div
                    className="acct__wishlist-swatch"
                    style={{ backgroundColor: item.imageColor }}
                    aria-hidden="true"
                  />
                )}
              </div>
              <div className="acct__wishlist-body">
                <p className="acct__wishlist-brand">{item.brand}</p>
                <Link href={`/product/${item.slug}`} className="acct__wishlist-name">
                  {item.name}
                </Link>
                <p className="acct__wishlist-price">{formatDisplayPrice(item.price)}</p>
                <div className="acct__wishlist-actions">
                  <button
                    type="button"
                    className="acct__btn acct__btn--primary"
                    onClick={() => {
                      if (has(item.productId)) {
                        showToast("Already in your wishlist", "info");
                        return;
                      }
                      add(toProduct(item));
                      showToast("Added to wishlist", "success");
                    }}
                  >
                    {has(item.productId) ? "Saved" : "Save"}
                  </button>
                  <Link
                    href={`/product/${item.slug}`}
                    className="acct__btn acct__btn--secondary"
                  >
                    View
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </main>
  );
}
