"use client";

import { shareProduct } from "@/lib/share/shareProduct";
import { useToastStore } from "@/store/toastStore";
import ProductShareIcon from "@/components/product/ProductShareIcon";
import "./product-share.css";

interface ProductShareButtonProps {
  title: string;
  url: string;
  text?: string;
  size?: number;
  className?: string;
  overlay?: boolean;
  position?: "top-right" | "top-left";
  /** Show icon + "Share" label (e.g. modal action rows). */
  showLabel?: boolean;
}

export default function ProductShareButton({
  title,
  url,
  text,
  size = 20,
  className = "",
  overlay = false,
  position = "top-right",
  showLabel = false,
}: ProductShareButtonProps) {
  const showToast = useToastStore((s) => s.show);

  async function handleShare(event: React.MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();

    const result = await shareProduct({ title, url, text });

    if (result === "copied") {
      showToast("Product link copied to clipboard", "success");
      return;
    }

    if (result === "failed") {
      showToast("Unable to share this product right now", "error");
    }
  }

  const iconSize = showLabel ? Math.max(size, 18) : size;

  return (
    <button
      type="button"
      className={[
        "product-share-btn",
        overlay ? "product-share-btn--overlay" : "",
        overlay ? `product-share-btn--${position}` : "",
        showLabel ? "product-share-btn--labeled" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      onClick={handleShare}
      aria-label={`Share ${title}`}
    >
      <ProductShareIcon className="product-share-btn__icon" size={iconSize} />
      {showLabel ? <span className="product-share-btn__label">Share</span> : null}
    </button>
  );
}
