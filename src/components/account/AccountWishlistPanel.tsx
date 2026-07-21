"use client";

import { useState } from "react";
import Link from "next/link";
import ProductShareButton from "@/components/product/ProductShareButton";
import StorefrontThumbImage from "@/components/common/StorefrontThumbImage";
import { Heart } from "lucide-react";
import { ROUTES } from "@/lib/routes";
import { useWishlistStore } from "@/store/wishlistStore";
import { useToastStore } from "@/store/toastStore";
import { formatDisplayPrice } from "@/utils/currency";
import type { Product } from "@/types/product";
import AccountEmptyState from "./AccountEmptyState";

function stockLabel(
  availability: Product["availability"] | undefined
): { text: string; inStock: boolean } {
  switch (availability) {
    case "out-of-stock":
      return { text: "Out of Stock", inStock: false };
    case "limited":
      return { text: "Limited Stock", inStock: true };
    case "in-stock":
    default:
      return { text: "In Stock", inStock: true };
  }
}

export default function AccountWishlistPanel() {
  const items = useWishlistStore((s) => s.items);
  const remove = useWishlistStore((s) => s.remove);
  const moveToCart = useWishlistStore((s) => s.moveToCart);
  const moveAllToCart = useWishlistStore((s) => s.moveAllToCart);
  const clear = useWishlistStore((s) => s.clear);
  const showToast = useToastStore((s) => s.show);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [sharing, setSharing] = useState(false);

  async function shareWishlist() {
    if (items.length === 0 || sharing) return;
    setSharing(true);
    try {
      const res = await fetch("/api/wishlist/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      });
      const json = (await res.json()) as { share?: { url: string }; error?: string };
      if (!res.ok || !json.share?.url) {
        throw new Error(json.error ?? "Share failed");
      }
      setShareUrl(json.share.url);
      try {
        await navigator.clipboard.writeText(json.share.url);
        showToast("Wishlist share link copied", "success");
      } catch {
        showToast("Wishlist share link created", "success");
      }
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Share failed", "error");
    } finally {
      setSharing(false);
    }
  }

  return (
    <div>
      <h2 className="acct__section-title">Wishlist</h2>
      <p className="acct__section-sub">
        {items.length} saved item{items.length === 1 ? "" : "s"} — your favorite gear, ready when you are.
      </p>

      {items.length > 0 ? (
        <>
          <div className="acct__toolbar">
            <button
              type="button"
              className="acct__btn acct__btn--primary"
              onClick={moveAllToCart}
            >
              Move All to Cart
            </button>
            <button
              type="button"
              className="acct__btn acct__btn--secondary"
              onClick={() => void shareWishlist()}
              disabled={sharing}
            >
              {sharing ? "Sharing…" : "Share wishlist"}
            </button>
            <button
              type="button"
              className="acct__btn acct__btn--secondary"
              onClick={clear}
            >
              Clear Wishlist
            </button>
          </div>

          {shareUrl ? (
            <p className="acct__section-sub" style={{ marginTop: "0.75rem" }}>
              Share link:{" "}
              <a href={shareUrl} target="_blank" rel="noopener noreferrer">
                {shareUrl}
              </a>
            </p>
          ) : null}

          <div className="acct__wishlist-grid">
            {items.map((item) => {
              const stock = stockLabel(item.availability);
              return (
                <article key={item.productId} className="acct__wishlist-card">
                  <ProductShareButton
                    overlay
                    position="top-left"
                    title={`${item.brand} ${item.name}`}
                    url={`/product/${item.slug}`}
                    size={16}
                  />
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
                    <Link
                      href={`/product/${item.slug}`}
                      className="acct__wishlist-name"
                    >
                      {item.name}
                    </Link>
                    <p className="acct__wishlist-price">
                      {formatDisplayPrice(item.price)}
                    </p>
                    <p
                      className={`acct__stock${stock.inStock ? " acct__stock--in" : " acct__stock--out"}`}
                    >
                      {stock.text}
                    </p>
                    <div className="acct__wishlist-actions">
                      <button
                        type="button"
                        className="acct__btn acct__btn--primary"
                        onClick={() => moveToCart(item.productId)}
                        disabled={!stock.inStock}
                      >
                        Add to cart
                      </button>
                      <button
                        type="button"
                        className="acct__btn acct__btn--danger"
                        onClick={() => remove(item.productId)}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </>
      ) : (
        <div className="acct__card">
          <AccountEmptyState
            icon={Heart}
            title="Your Wishlist Is Empty"
            description="Explore our catalog and tap the heart icon to save instruments, studio gear, and more."
            actionLabel="Browse Products"
            actionHref={ROUTES.search}
          />
        </div>
      )}
    </div>
  );
}
