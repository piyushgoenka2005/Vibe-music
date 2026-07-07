"use client";

import { SquareArrowUp } from "lucide-react";
import { shareProduct } from "@/lib/share/shareProduct";
import { useToastStore } from "@/store/toastStore";
import "./product-share.css";

interface ProductShareButtonProps {
  title: string;
  url: string;
  text?: string;
  size?: number;
  className?: string;
  overlay?: boolean;
  position?: "top-right" | "top-left";
}

export default function ProductShareButton({
  title,
  url,
  text,
  size = 18,
  className = "",
  overlay = false,
  position = "top-right",
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

  return (
    <button
      type="button"
      className={[
        "product-share-btn",
        overlay ? "product-share-btn--overlay" : "",
        overlay ? `product-share-btn--${position}` : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      onClick={handleShare}
      aria-label={`Share ${title}`}
    >
      <SquareArrowUp size={size} strokeWidth={1.75} aria-hidden="true" />
    </button>
  );
}
