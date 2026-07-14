"use client";

import { useCallback, useEffect, useRef, useState, type MouseEvent } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import Link from "next/link";
import { Heart, X } from "lucide-react";
import ProductShareButton from "@/components/product/ProductShareButton";
import { productPath } from "@/lib/routes";
import { useIsClient } from "@/hooks/useIsClient";
import { useCartStore } from "@/store/cartStore";
import { useWishlistStore } from "@/store/wishlistStore";
import { formatCurrency, formatDisplayPrice, isPurchasablePrice } from "@/utils/currency";
import NotifyMeButton from "@/components/product/NotifyMeButton";
import type { GearStory } from "@/types/gear-story";
import type { Product } from "@/types/product";

interface GearStoryModalProps {
  story: GearStory | null;
  onClose: () => void;
}

function storyToProduct(story: GearStory): Product {
  return {
    id: story.productId,
    slug: story.slug,
    name: story.name,
    brand: story.brand,
    brandSlug: story.brand.toLowerCase().replace(/\s+/g, "-"),
    category: story.category,
    categorySlug: "",
    price: story.salePrice ?? story.price,
    rating: story.rating,
    reviewCount: story.reviewCount,
    availability: story.availability,
    condition: "new",
    imageColor: "#e8e8e8",
    image: story.image,
  };
}

function availabilityLabel(availability: GearStory["availability"]): string {
  if (availability === "in-stock") return "In stock";
  if (availability === "limited") return "Limited stock";
  return "Out of stock";
}

function gallerySources(story: GearStory): string[] {
  const sources =
    story.images.length > 0
      ? story.images
      : [story.image || story.posterUrl].filter(Boolean);
  return Array.from(new Set(sources.filter((src) => Boolean(src?.trim()))));
}

export default function GearStoryModal({ story, onClose }: GearStoryModalProps) {
  const isClient = useIsClient();
  const [activeImage, setActiveImage] = useState(0);
  const [failedSrc, setFailedSrc] = useState<Record<string, boolean>>({});
  const zoomRef = useRef<HTMLDivElement>(null);
  const addItem = useCartStore((s) => s.addItem);
  const openCart = useCartStore((s) => s.openDrawer);
  const isWishlisted = useWishlistStore((s) =>
    story ? s.has(story.productId) : false
  );
  const toggleWishlist = useWishlistStore((s) => s.toggle);

  const open = Boolean(story);

  useEffect(() => {
    if (!open) return;
    const frame = requestAnimationFrame(() => {
      setActiveImage(0);
      setFailedSrc({});
    });
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    window.addEventListener("keydown", onKeyDown);
    return () => {
      cancelAnimationFrame(frame);
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, story?.id, onClose]);

  const handleAddToCart = useCallback(() => {
    if (
      !story ||
      story.availability === "out-of-stock" ||
      !isPurchasablePrice(story.price)
    ) {
      return;
    }
    addItem(storyToProduct(story), 1);
    openCart();
    onClose();
  }, [addItem, onClose, openCart, story]);

  const handleImageMouseMove = useCallback(
    (event: MouseEvent<HTMLDivElement>) => {
      const bounds = event.currentTarget.getBoundingClientRect();
      const x = ((event.clientX - bounds.left) / bounds.width) * 100;
      const y = ((event.clientY - bounds.top) / bounds.height) * 100;
      zoomRef.current?.style.setProperty("--zoom-x", `${x}%`);
      zoomRef.current?.style.setProperty("--zoom-y", `${y}%`);
    },
    []
  );

  const resetImageZoom = useCallback(() => {
    zoomRef.current?.style.setProperty("--zoom-x", "50%");
    zoomRef.current?.style.setProperty("--zoom-y", "50%");
  }, []);

  if (!isClient || !story) return null;

  const product = storyToProduct(story);
  const displayPrice = story.salePrice ?? story.price;
  const hasCatalogPrice = isPurchasablePrice(displayPrice);
  const hasDiscount =
    story.discountPercentage > 0 && story.originalPrice > displayPrice;
  const gallery = gallerySources(story);
  const activeSrc = gallery[activeImage] ?? story.image ?? story.posterUrl;
  const mainSrc =
    failedSrc[activeSrc] && story.posterUrl && story.posterUrl !== activeSrc
      ? story.posterUrl
      : activeSrc;

  return createPortal(
    <div
      className="gear-story-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="gear-story-modal-title"
    >
      <button
        type="button"
        className="gear-story-modal__backdrop"
        onClick={onClose}
        aria-label="Close product preview"
      />

      <div className="gear-story-modal__panel">
        <button
          type="button"
          className="gear-story-modal__close"
          onClick={onClose}
          aria-label="Close"
        >
          <X size={20} aria-hidden="true" />
        </button>

        <div className="gear-story-modal__layout">
          <div className="gear-story-modal__gallery">
            <div
              ref={zoomRef}
              className="gear-story-modal__zoom"
              onMouseMove={handleImageMouseMove}
              onMouseLeave={resetImageZoom}
            >
              <ProductShareButton
                overlay
                position="top-right"
                title={story.name}
                url={productPath(story.slug)}
                text={`Check out ${story.name} at Vibe Music`}
                size={18}
                className="gear-story-modal__share"
              />
              {mainSrc ? (
                <Image
                  src={mainSrc}
                  alt={story.name}
                  fill
                  sizes="(max-width: 768px) 90vw, 420px"
                  priority
                  className="gear-story-modal__image"
                  onError={() =>
                    setFailedSrc((prev) => ({ ...prev, [activeSrc]: true }))
                  }
                />
              ) : null}
            </div>
            {gallery.length > 1 ? (
              <div className="gear-story-modal__thumbs" role="list">
                {gallery.slice(0, 4).map((src, index) => (
                  <button
                    key={`${src}-${index}`}
                    type="button"
                    role="listitem"
                    className={`gear-story-modal__thumb${
                      index === activeImage ? " gear-story-modal__thumb--active" : ""
                    }`}
                    onClick={() => setActiveImage(index)}
                    aria-label={`View image ${index + 1}`}
                  >
                    <Image
                      src={src}
                      alt=""
                      width={112}
                      height={112}
                      sizes="56px"
                      loading="lazy"
                    />
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          <div className="gear-story-modal__details">
            <p className="gear-story-modal__brand">{story.brand}</p>
            <h2 id="gear-story-modal-title" className="gear-story-modal__title">
              {story.name}
            </h2>

            <div className="gear-story-modal__price-row">
              {hasCatalogPrice ? (
                <>
                  <span className="gear-story-modal__price">
                    {formatDisplayPrice(story.price, story.salePrice)}
                  </span>
                  {hasDiscount ? (
                    <>
                      <span className="gear-story-modal__price-was">
                        {formatCurrency(story.originalPrice)}
                      </span>
                      <span className="gear-story-modal__discount">
                        {story.discountPercentage}% off
                      </span>
                    </>
                  ) : null}
                </>
              ) : (
                <span className="gear-story-modal__price gear-story-modal__price--muted">
                  View product page for pricing
                </span>
              )}
            </div>

            <div className="gear-story-modal__meta">
              <span
                className={`gear-story-modal__stock gear-story-modal__stock--${story.availability}`}
              >
                {availabilityLabel(story.availability)}
              </span>
              <span className="gear-story-modal__rating" aria-label={`Rated ${story.rating} out of 5`}>
                <span aria-hidden="true">{"★".repeat(Math.round(story.rating))}</span>
                {story.rating.toFixed(1)} ({story.reviewCount})
              </span>
            </div>

            <p className="gear-story-modal__description">{story.description}</p>

            <ul className="gear-story-modal__features">
              {story.features.map((feature) => (
                <li key={feature}>{feature}</li>
              ))}
            </ul>

            <div className="gear-story-modal__actions">
              {hasCatalogPrice ? (
                <button
                  type="button"
                  className="gear-story-modal__btn gear-story-modal__btn--primary"
                  onClick={handleAddToCart}
                  disabled={story.availability === "out-of-stock"}
                >
                  Add to cart
                </button>
              ) : (
                <NotifyMeButton
                  variant="inline"
                  className="gear-story-modal__btn gear-story-modal__btn--primary"
                  productId={story.productId}
                  productSlug={story.slug}
                  productName={story.name}
                />
              )}
              <Link
                href={productPath(story.slug)}
                className="gear-story-modal__btn gear-story-modal__btn--secondary"
                onClick={onClose}
              >
                View product
              </Link>
              <button
                type="button"
                className="gear-story-modal__btn gear-story-modal__btn--tertiary"
                onClick={() => toggleWishlist(product)}
                aria-pressed={isWishlisted}
              >
                <Heart
                  size={18}
                  fill={isWishlisted ? "currentColor" : "none"}
                  aria-hidden="true"
                />
                {isWishlisted ? "Saved" : "Wishlist"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
