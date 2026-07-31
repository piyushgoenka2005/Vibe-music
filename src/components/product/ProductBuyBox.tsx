"use client";

import type { RefObject } from "react";
import { useMemo, useState } from "react";
import { MapPin, Truck } from "lucide-react";
import {
  formatCurrencyPrecise,
  formatDisplayPrice,
  isPurchasablePrice,
} from "@/utils/currency";
import type { ProductDetail, ProductVariant } from "@/types/product";
import Link from "next/link";
import { ROUTES } from "@/lib/routes";
import { useToastStore } from "@/store/toastStore";
import NotifyMeButton from "./NotifyMeButton";

interface ProductBuyBoxProps {
  product: ProductDetail;
  selectedVariant: ProductVariant;
  quantity: number;
  onQuantityChange: (qty: number) => void;
  onAddToCart: () => void;
  onBuyNow: () => void;
  onToggleWishlist: () => void;
  isWishlisted: boolean;
  atcSentinelRef?: RefObject<HTMLDivElement | null>;
}

function formatPrice(value: number): string {
  return formatDisplayPrice(value);
}

function availabilityLabel(av: ProductVariant["availability"]): string {
  switch (av) {
    case "in-stock":
      return "In stock";
    case "limited":
      return "Only a few left";
    case "out-of-stock":
      return "Currently unavailable";
  }
}

function getDeliveryEstimate() {
  const now = new Date();
  const delivery = new Date(now);
  let businessDays = 0;

  while (businessDays < 5) {
    delivery.setDate(delivery.getDate() + 1);
    const day = delivery.getDay();
    if (day !== 0 && day !== 6) businessDays += 1;
  }

  const dateLabel = delivery.toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  const cutoff = new Date(now);
  cutoff.setHours(18, 0, 0, 0);

  let orderWindow = "today";
  if (now < cutoff) {
    const diffMs = cutoff.getTime() - now.getTime();
    const hours = Math.floor(diffMs / 3_600_000);
    const minutes = Math.floor((diffMs % 3_600_000) / 60_000);
    orderWindow = `${hours} hrs ${minutes} mins`;
  }

  return { dateLabel, orderWindow };
}

function splitPriceParts(price: number) {
  const formatted = formatCurrencyPrecise(price);
  const match = formatted.match(/^([^\d]*)([\d,]+)(?:\.(\d{2}))?$/);
  if (!match) return { symbol: "₹", whole: formatted, fraction: null };

  return {
    symbol: match[1] || "₹",
    whole: match[2],
    fraction: match[3] ?? null,
  };
}

export default function ProductBuyBox({
  product,
  selectedVariant,
  quantity,
  onQuantityChange,
  onAddToCart,
  onBuyNow,
  onToggleWishlist,
  isWishlisted,
  atcSentinelRef,
}: ProductBuyBoxProps) {
  const displayPrice = selectedVariant.price;
  const lineTotal = displayPrice * quantity;
  const canPurchase =
    isPurchasablePrice(displayPrice) &&
    selectedVariant.availability !== "out-of-stock";
  const isComingSoon = !isPurchasablePrice(displayPrice);
  const onSale = product.salePrice !== null && product.msrp !== null;
  const savings =
    onSale && product.msrp ? product.msrp - displayPrice : 0;
  const maxQuantity = Math.max(1, Math.min(99, selectedVariant.stock || 99));
  const { dateLabel, orderWindow } = useMemo(() => getDeliveryEstimate(), []);
  const priceParts = splitPriceParts(lineTotal);

  const [pincode, setPincode] = useState("");
  const [locationLabel, setLocationLabel] = useState("India");
  const [showPinInput, setShowPinInput] = useState(false);
  const [pinLoading, setPinLoading] = useState(false);
  const [showDeliveryDetails, setShowDeliveryDetails] = useState(false);
  const showToast = useToastStore((s) => s.show);
  const isOutOfStock = selectedVariant.availability === "out-of-stock";

  async function updateLocation() {
    const trimmed = pincode.trim();
    if (!/^\d{6}$/.test(trimmed)) {
      showToast("Enter a valid 6-digit PIN code", "error");
      return;
    }

    setPinLoading(true);
    try {
      const response = await fetch("/api/shipping/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subtotal: lineTotal,
          discount: 0,
          postalCode: trimmed,
        }),
      });

      if (response.ok) {
        const data = (await response.json()) as { zone?: { name: string } | null };
        setLocationLabel(
          data.zone?.name ? `${trimmed} (${data.zone.name})` : trimmed
        );
        setShowPinInput(false);
      } else {
        showToast("Could not verify delivery for this PIN code", "error");
      }
    } catch {
      showToast("Could not verify delivery for this PIN code", "error");
    } finally {
      setPinLoading(false);
    }
  }

  return (
    <aside className="pdp-buybox" aria-label="Purchase options">
      <div ref={atcSentinelRef} className="pdp-buybox__card">
        <div className="pdp-buybox__price-block">
          {isComingSoon ? (
            <div className="pdp-buybox__price pdp-buybox__price--coming-soon">
              <span className="pdp-buybox__coming-soon-label">Coming Soon</span>
            </div>
          ) : (
            <>
              {onSale && product.msrp && quantity === 1 ? (
                <div className="pdp-buybox__list-row">
                  <span>List Price:</span>
                  <span className="pdp-buybox__list-price">
                    {formatPrice(product.msrp)}
                  </span>
                </div>
              ) : null}

              <div className="pdp-buybox__price">
                <span className="pdp-buybox__price-symbol">{priceParts.symbol}</span>
                <span className="pdp-buybox__price-whole">{priceParts.whole}</span>
                {priceParts.fraction ? (
                  <span className="pdp-buybox__price-fraction">
                    .{priceParts.fraction}
                  </span>
                ) : null}
              </div>

              {savings > 0 && quantity === 1 ? (
                <p className="pdp-buybox__savings">
                  You save {formatPrice(savings)}
                  {product.msrp
                    ? ` (${Math.round((savings / product.msrp) * 100)}%)`
                    : ""}
                </p>
              ) : null}
            </>
          )}
        </div>

        {canPurchase ? (
          <div className="pdp-buybox__delivery">
            <p className="pdp-buybox__delivery-line">
              <span className="pdp-buybox__delivery-free">FREE delivery</span>{" "}
              <strong>{dateLabel}</strong>
              {orderWindow !== "today" ? (
                <>
                  . Order within <span>{orderWindow}</span>.
                </>
              ) : null}{" "}
              <button
                type="button"
                className="pdp-buybox__link"
                onClick={() => setShowDeliveryDetails((open) => !open)}
              >
                Details
              </button>
            </p>
            {showDeliveryDetails ? (
              <p className="pdp-buybox__delivery-urgency">
                Standard delivery · Dispatches in 1–2 business days · GST invoice
                included
              </p>
            ) : null}
          </div>
        ) : null}

        <div className="pdp-buybox__location">
          <MapPin size={14} aria-hidden="true" />
          <span>
            Delivering to {locationLabel} —{" "}
            <button
              type="button"
              className="pdp-buybox__link"
              onClick={() => setShowPinInput((open) => !open)}
            >
              Update location
            </button>
          </span>
        </div>

        {showPinInput ? (
          <div className="pdp-buybox__pin">
            <input
              type="text"
              inputMode="numeric"
              placeholder="Enter PIN code"
              value={pincode}
              onChange={(event) =>
                setPincode(event.target.value.replace(/\D/g, "").slice(0, 6))
              }
              maxLength={6}
              aria-label="PIN code"
            />
            <button
              type="button"
              className="pdp-buybox__pin-apply"
              onClick={() => void updateLocation()}
              disabled={pinLoading || pincode.length !== 6}
            >
              {pinLoading ? "..." : "Apply"}
            </button>
          </div>
        ) : null}

        <p
          className={`pdp-buybox__stock pdp-buybox__stock--${selectedVariant.availability}`}
        >
          {availabilityLabel(selectedVariant.availability)}
        </p>

        {!isComingSoon ? (
          <div className="pdp-buybox__qty" role="group" aria-label="Quantity">
            <span className="pdp-buybox__qty-label" id="pdp-buybox-qty-label">
              Quantity
            </span>
            <div className="pdp-buybox__qty-control">
              <button
                type="button"
                className="pdp-buybox__qty-btn"
                onClick={() => onQuantityChange(Math.max(1, quantity - 1))}
                disabled={quantity <= 1}
                aria-label="Decrease quantity"
              >
                −
              </button>
              <span
                className="pdp-buybox__qty-value"
                aria-labelledby="pdp-buybox-qty-label"
                aria-live="polite"
              >
                {quantity}
              </span>
              <button
                type="button"
                className="pdp-buybox__qty-btn"
                onClick={() =>
                  onQuantityChange(Math.min(maxQuantity, quantity + 1))
                }
                disabled={quantity >= maxQuantity}
                aria-label="Increase quantity"
              >
                +
              </button>
            </div>
          </div>
        ) : null}

        <div className="pdp-buybox__actions">
          {isComingSoon || isOutOfStock ? (
            <NotifyMeButton
              variant="pdp-primary"
              productId={product.id}
              productSlug={product.slug}
              productName={product.name}
            />
          ) : (
            <>
              <button
                type="button"
                className="pdp-buybox__btn pdp-buybox__btn--cart"
                onClick={onAddToCart}
                disabled={!canPurchase}
              >
                Add to cart
              </button>
              <button
                type="button"
                className="pdp-buybox__btn pdp-buybox__btn--buy"
                onClick={onBuyNow}
                disabled={!canPurchase}
              >
                Buy Now
              </button>
            </>
          )}
        </div>

        <dl className="pdp-buybox__meta">
          <div className="pdp-buybox__meta-row">
            <dt>Shipper / Seller</dt>
            <dd className="pdp-buybox__meta-value">
              <Truck
                className="pdp-buybox__meta-icon"
                size={16}
                strokeWidth={1.75}
                aria-hidden
              />
              <span>Vibe Music</span>
            </dd>
          </div>
          <div className="pdp-buybox__meta-row">
            <dt>Payment</dt>
            <dd>
              <Link href={ROUTES.page("terms")} className="pdp-buybox__link">
                Secure transaction
              </Link>
            </dd>
          </div>
        </dl>

        <div className="pdp-buybox__divider" aria-hidden="true" />

        <button
          type="button"
          className="pdp-buybox__wishlist"
          onClick={onToggleWishlist}
          aria-pressed={isWishlisted}
        >
          {isWishlisted ? "Added to Wish List" : "Add to Wish List"}
        </button>
      </div>
    </aside>
  );
}
