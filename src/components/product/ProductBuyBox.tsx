"use client";

import { useMemo, useState, type RefObject } from "react";
import { MapPin, Truck } from "lucide-react";
import { isPurchasablePrice, useCurrency } from "@/utils/currency";
import { useTranslation } from "@/lib/i18n";
import type { ProductDetail, ProductVariant } from "@/types/product";
import Link from "next/link";
import { ROUTES } from "@/lib/routes";
import { useToastStore } from "@/store/toastStore";
import NotifyMeButton from "./NotifyMeButton";
import { getDeliveryEstimate } from "@/lib/shipping/deliveryEstimate";
import { preloadRazorpayCheckout } from "@/hooks/useRazorpay";

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

function splitPriceParts(formatted: string, defaultSymbol = "₹") {
  const match = formatted.match(/^([^\d]*)([\d,]+)(?:\.(\d{2}))?$/);
  if (!match) return { symbol: defaultSymbol, whole: formatted, fraction: null };

  const symbol = (match[1] || defaultSymbol).replace(/\s+/g, "") || defaultSymbol;

  return {
    symbol,
    whole: match[2],
    fraction: match[3] ?? null,
  };
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
  const { formatPrecise, symbol } = useCurrency();
  const { t } = useTranslation();
  const displayPrice = selectedVariant.price;
  const lineTotal = displayPrice * quantity;
  const canPurchase =
    isPurchasablePrice(displayPrice) && selectedVariant.availability !== "out-of-stock";
  const isComingSoon = !isPurchasablePrice(displayPrice);

  const maxQuantity = Math.max(1, Math.min(99, selectedVariant.stock || 99));
  const { dateLabel, orderWindow } = useMemo(() => getDeliveryEstimate(), []);
  const formattedLineTotal = formatPrecise(lineTotal);
  const priceParts = splitPriceParts(formattedLineTotal, symbol);

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
        setLocationLabel(data.zone?.name ? `${trimmed} (${data.zone.name})` : trimmed);
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
            <div
              className="pdp-buybox__price pdp-buybox__price--tag"
              aria-label="Current price"
              suppressHydrationWarning
            >
              <span className="pdp-buybox__price-symbol" suppressHydrationWarning>
                {priceParts.symbol}
              </span>
              <span className="pdp-buybox__price-whole" suppressHydrationWarning>
                {priceParts.whole}
              </span>
              {priceParts.fraction ? (
                <span className="pdp-buybox__price-fraction" suppressHydrationWarning>
                  .{priceParts.fraction}
                </span>
              ) : null}
            </div>
          )}
        </div>

        {canPurchase ? (
          <div className="pdp-buybox__delivery">
            <p className="pdp-buybox__delivery-line" suppressHydrationWarning>
              <span className="pdp-buybox__delivery-free">FREE delivery</span>{" "}
              <strong suppressHydrationWarning>{dateLabel}</strong>
              {orderWindow !== "today" ? (
                <>
                  . Order within <span suppressHydrationWarning>{orderWindow}</span>.
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
                Standard delivery · Dispatches in 1–2 business days · GST invoice included
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
              onChange={(event) => setPincode(event.target.value.replace(/\D/g, "").slice(0, 6))}
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

        <p className={`pdp-buybox__stock pdp-buybox__stock--${selectedVariant.availability}`}>
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
                onClick={() => onQuantityChange(Math.min(maxQuantity, quantity + 1))}
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
                {t("pdp.addToCart", "Add to cart")}
              </button>
              <button
                type="button"
                className="pdp-buybox__btn pdp-buybox__btn--buy"
                onClick={onBuyNow}
                onMouseEnter={preloadRazorpayCheckout}
                onTouchStart={preloadRazorpayCheckout}
                onFocus={preloadRazorpayCheckout}
                disabled={!canPurchase}
              >
                {t("pdp.buyNow", "Buy Now")}
              </button>
            </>
          )}
        </div>

        <dl className="pdp-buybox__meta">
          <div className="pdp-buybox__meta-row">
            <dt>Shipper / Seller</dt>
            <dd className="pdp-buybox__meta-value">
              <Truck className="pdp-buybox__meta-icon" size={16} strokeWidth={1.75} aria-hidden />
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
