"use client";

import { useEffect, useMemo, useRef, useSyncExternalStore, useState, type KeyboardEvent, type MouseEvent } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Trash2 } from "lucide-react";
import { preloadRazorpayCheckout } from "@/hooks/useRazorpay";
import CheckoutSummary, {
  computeCheckoutInvoice,
} from "@/components/checkout/CheckoutSummary";
import CheckoutPaymentMethods, {
  type OnlinePaymentChannel,
} from "@/components/checkout/CheckoutPaymentMethods";
import CheckoutGlassButton from "@/components/checkout/CheckoutGlassButton";
import StorefrontBackButton from "@/components/layout/StorefrontBackButton";
import StorefrontThumbImage from "@/components/common/StorefrontThumbImage";
import AddressAutocompleteField from "@/components/checkout/AddressAutocompleteField";
import { INDIAN_STATES } from "@/lib/address/indianStates";
import { useCheckoutPayment } from "@/hooks/useCheckoutPayment";
import {
  addressToShipping,
  getAddressDisplayLabel,
} from "@/lib/address/addressMappers";
import { ROUTES } from "@/lib/routes";
import { normalizeIndianPhone } from "@/lib/validations/address";
import { DEFAULT_GST_RATE } from "@/lib/gstCalculator";
import { type ShippingMethod, getDefaultShippingMethod, getShippingChargeForMethod, SHIPPING_METHOD_IDS } from "@/lib/shipping/shippingMethods";
import { useCartHydrated } from "@/hooks/useCartHydrated";
import { useBuyNowHydrated } from "@/hooks/useBuyNowHydrated";
import { useCartCatalogReprice } from "@/hooks/useCartCatalogReprice";
import { useAddresses } from "@/hooks/useAddresses";
import { useAccountProfileStore } from "@/store/accountProfileStore";
import { useAuthStore } from "@/store/authStore";
import { useCartStore } from "@/store/cartStore";
import {
  isBuyNowCheckoutSearchParam,
  setLastCheckoutMode,
  useBuyNowStore,
} from "@/store/buyNowStore";
import { useToastStore } from "@/store/toastStore";
import { formatCurrencyPrecise } from "@/utils/currency";
import {
  trackBeginCheckout,
  trackAddShippingInfo,
  trackAddPaymentInfo,
} from "@/lib/analytics/events";
import { cartItemsToAnalyticsLines } from "@/lib/analytics/cartLines";
import type { PaymentMethod, ShippingAddress } from "@/types/order";
import "@/components/checkout/checkout.css";

type CheckoutStep = "address" | "summary" | "payment";

const STEPS: Array<{ id: CheckoutStep; label: string }> = [
  { id: "address", label: "Shipping" },
  { id: "summary", label: "Review" },
  { id: "payment", label: "Payment" },
];

const EMPTY_ADDRESS: ShippingAddress = {
  name: "",
  line1: "",
  line2: "",
  city: "",
  state: "Maharashtra",
  postalCode: "",
  country: "India",
  phone: "",
};

function isAddressComplete(address: ShippingAddress): boolean {
  return Boolean(
    address.name.trim() &&
      address.line1.trim() &&
      address.city.trim() &&
      address.state.trim() &&
      address.postalCode.trim() &&
      address.phone?.trim()
  );
}

function resolveAddressDraft(
  addressForm: ShippingAddress,
  options: { profilePhone?: string; profileName?: string }
): ShippingAddress {
  const phone = addressForm.phone?.trim() || options.profilePhone?.trim() || "";
  return {
    ...addressForm,
    name: addressForm.name.trim() || options.profileName?.trim() || "",
    phone: phone ? normalizeIndianPhone(phone) : "",
  };
}

function addressesMatch(a: ShippingAddress, b: ShippingAddress): boolean {
  return (
    a.name.trim().toLowerCase() === b.name.trim().toLowerCase() &&
    a.line1.trim().toLowerCase() === b.line1.trim().toLowerCase() &&
    a.postalCode.trim() === b.postalCode.trim() &&
    normalizeIndianPhone(a.phone ?? "") === normalizeIndianPhone(b.phone ?? "")
  );
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export default function CheckoutPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isBuyNowMode = isBuyNowCheckoutSearchParam(searchParams.get("buyNow"));
  const cartItems = useCartStore((s) => s.items);
  const buyNowItem = useBuyNowStore((s) => s.item);
  const items = useMemo(() => isBuyNowMode ? (buyNowItem ? [buyNowItem] : []) : cartItems, [isBuyNowMode, buyNowItem, cartItems]);
  const cartCouponCode = useCartStore((s) => s.couponCode);
  const applyCoupon = useCartStore((s) => s.applyCoupon);
  const cartCouponDiscount = useCartStore((s) => s.discount());
  const couponCode = isBuyNowMode ? null : cartCouponCode;
  const couponDiscount = isBuyNowMode ? 0 : cartCouponDiscount;
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const phone = useAccountProfileStore((s) => s.phone);
  const {
    addresses,
    defaultAddress,
    createAddress,
    deleteAddress,
    isDeleting,
  } = useAddresses();
  const showToast = useToastStore((s) => s.show);
  const cartHydrated = useCartHydrated();
  const buyNowHydrated = useBuyNowHydrated();
  const checkoutHydrated = isBuyNowMode ? buyNowHydrated : cartHydrated;
  useCartCatalogReprice(!isBuyNowMode);
  const checkoutTrackedRef = useRef(false);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, []);

  useEffect(() => {
    if (isBuyNowMode) {
      setLastCheckoutMode("buyNow");
      return;
    }
    setLastCheckoutMode("cart");
    useBuyNowStore.getState().clearBuyNow();
  }, [isBuyNowMode]);

  useEffect(() => {
    if (!checkoutHydrated || items.length === 0 || checkoutTrackedRef.current) return;
    checkoutTrackedRef.current = true;
    trackBeginCheckout(cartItemsToAnalyticsLines(items), couponCode ?? undefined);
  }, [checkoutHydrated, items, couponCode]);

  const [step, setStep] = useState<CheckoutStep>("address");
  const savedAddresses = useMemo(
    () => (isAuthenticated ? addresses : []),
    [isAuthenticated, addresses]
  );
  const [useNewAddressOverride, setUseNewAddressOverride] = useState<boolean | null>(
    null
  );
  const useNewAddress = useNewAddressOverride ?? savedAddresses.length === 0;

  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const effectiveSelectedAddressId =
    selectedAddressId ??
    (!useNewAddress && defaultAddress ? defaultAddress.id : null);

  const [addressForm, setAddressForm] = useState<ShippingAddress>(EMPTY_ADDRESS);
  const [confirmedAddress, setConfirmedAddress] =
    useState<ShippingAddress | null>(null);
  const shippingMethod = getDefaultShippingMethod();
  const [zoneQuote, setZoneQuote] = useState<{
    key: string;
    charges: Partial<Record<ShippingMethod, number>>;
  } | null>(null);
  const [onlineChannel, setOnlineChannel] =
    useState<OnlinePaymentChannel>("upi");
  const [checkoutCapabilities, setCheckoutCapabilities] = useState<{
    placesAutocomplete: boolean;
    razorpayConfigured: boolean;
    demoPaymentsAllowed: boolean;
    onlinePaymentsAvailable: boolean;
  } | null>(null);
  const [guestEmailInput, setGuestEmailInput] = useState("");
  const guestEmail = guestEmailInput || user?.email || "";
  const [addressError, setAddressError] = useState<string | null>(null);
  const [footerInView, setFooterInView] = useState(false);
  const mobileBarReady = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  useEffect(() => {
    const footer = document.querySelector<HTMLElement>(
      ".site-footer__shell, .site-footer-newsletter, .site-footer"
    );
    if (!footer) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setFooterInView(Boolean(entry?.isIntersecting));
      },
      {
        root: null,
        threshold: 0,
        // Hide once the footer shell starts covering the bottom of the screen
        rootMargin: "0px 0px -8% 0px",
      }
    );

    observer.observe(footer);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    let cancelled = false;
    void fetch("/api/checkout/capabilities")
      .then(async (response) => {
        if (!response.ok) return null;
        return response.json() as Promise<{
          placesAutocomplete: boolean;
          razorpayConfigured: boolean;
          demoPaymentsAllowed: boolean;
          onlinePaymentsAvailable: boolean;
        }>;
      })
      .then((data) => {
        if (cancelled || !data) return;
        setCheckoutCapabilities(data);
      })
      .catch(() => {
        /* Keep optimistic defaults if capabilities fail to load. */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    preloadRazorpayCheckout();
    if (step === "summary" || step === "payment") {
      void import("@/components/checkout/SwipeToPayButton");
    }
  }, [step]);

  useEffect(() => {
    if (isBuyNowMode) return;
    const fromUrl = searchParams.get("coupon") ?? searchParams.get("code");
    if (!fromUrl || cartCouponCode) return;
    void applyCoupon(fromUrl);
  }, [searchParams, cartCouponCode, applyCoupon, isBuyNowMode]);

  const placesAutocomplete =
    checkoutCapabilities?.placesAutocomplete ?? false;
  const razorpayConfigured =
    checkoutCapabilities?.razorpayConfigured ??
    Boolean(process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID?.startsWith("rzp_"));
  const onlinePaymentsAvailable =
    checkoutCapabilities?.onlinePaymentsAvailable ?? razorpayConfigured;
  const demoPaymentsLikely =
    onlinePaymentsAvailable &&
    !razorpayConfigured &&
    (checkoutCapabilities?.demoPaymentsAllowed ??
      process.env.NODE_ENV !== "production");

  const checkoutItems = items.map((item) => ({
    productId: item.productId,
    variantId: item.variantId,
    variantSku: item.variantSku,
    variantLabel: item.variantLabel,
    name: item.name,
    quantity: item.quantity,
    price: item.price,
    gstRate: item.gstRate ?? DEFAULT_GST_RATE,
  }));

  const addressDraft = resolveAddressDraft(addressForm, {
    profilePhone: phone,
    profileName: user?.name,
  });

  const resolvedAddress: ShippingAddress | null = useMemo(() => {
    if (confirmedAddress) {
      return confirmedAddress;
    }

    if (useNewAddress || savedAddresses.length === 0) {
      return isAddressComplete(addressDraft) ? addressDraft : null;
    }

    const saved = savedAddresses.find((a) => a.id === effectiveSelectedAddressId);
    if (!saved) return null;
    return addressToShipping(saved);
  }, [
    confirmedAddress,
    useNewAddress,
    addressDraft,
    savedAddresses,
    effectiveSelectedAddressId,
  ]);

  const cartSubtotal = checkoutItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const effectivePaymentMethod: PaymentMethod = "razorpay";

  const buyerState = resolvedAddress?.state ?? "Maharashtra";
  const email = (user?.email ?? guestEmail).trim().toLowerCase();
  const contactPhone = resolvedAddress?.phone || phone || "";

  const hasValidContact = isAuthenticated
    ? Boolean(email)
    : Boolean(email && isValidEmail(email));

  const canContinueFromAddress =
    Boolean(confirmedAddress) ||
    Boolean(!useNewAddress && effectiveSelectedAddressId) ||
    isAddressComplete(addressDraft);

  const canProceedFromAddress =
    canContinueFromAddress &&
    (isAuthenticated ? hasValidContact : Boolean(guestEmail && isValidEmail(guestEmail)));

  const displayItems = items.map((item) => ({
    productId: item.productId,
    variantId: item.variantId,
    variantSku: item.variantSku,
    variantLabel: item.variantLabel,
    name: item.name,
    quantity: item.quantity,
    price: item.price,
    gstRate: item.gstRate ?? DEFAULT_GST_RATE,
    lineId: item.lineId,
    image: item.image,
    imageColor: item.imageColor,
  }));

  const fallbackShippingCharges = Object.fromEntries(
    SHIPPING_METHOD_IDS.map((id) => [
      id,
      getShippingChargeForMethod(id, cartSubtotal, couponDiscount),
    ])
  ) as Partial<Record<ShippingMethod, number>>;

  const shippingQuoteKey = resolvedAddress?.postalCode
    ? `${resolvedAddress.postalCode}:${resolvedAddress.state}:${cartSubtotal}:${couponDiscount}`
    : null;

  const shippingMethodCharges =
    zoneQuote?.key === shippingQuoteKey
      ? zoneQuote.charges
      : fallbackShippingCharges;

  const activeShippingCharge =
    shippingMethodCharges[shippingMethod] ??
    fallbackShippingCharges[shippingMethod] ??
    0;

  useEffect(() => {
    if (!shippingQuoteKey || !resolvedAddress?.postalCode) return;

    let cancelled = false;
    void (async () => {
      try {
        const response = await fetch("/api/shipping/quote", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            subtotal: cartSubtotal,
            discount: couponDiscount,
            postalCode: resolvedAddress.postalCode,
            state: resolvedAddress.state,
          }),
        });
        if (!response.ok || cancelled) return;
        const data = (await response.json()) as {
          methods?: Array<{ id: ShippingMethod; charge: number }>;
        };
        if (!data.methods?.length || cancelled) return;
        setZoneQuote({
          key: shippingQuoteKey,
          charges: Object.fromEntries(
            data.methods.map((method) => [method.id, method.charge])
          ),
        });
      } catch {
        // Keep fallback charges until the next successful quote fetch.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [shippingQuoteKey, resolvedAddress?.postalCode, resolvedAddress?.state, cartSubtotal, couponDiscount]);

  const invoice = computeCheckoutInvoice(
    checkoutItems,
    couponDiscount,
    buyerState,
    0,
    shippingMethod,
    activeShippingCharge
  );

  const payment = useCheckoutPayment({
    items: checkoutItems,
    shippingAddress: resolvedAddress ?? EMPTY_ADDRESS,
    shippingMethod,
    buyerState,
    email,
    customerName: resolvedAddress?.name,
    customerPhone: contactPhone,
    phone: contactPhone || undefined,
    paymentMethod: effectivePaymentMethod,
    checkoutMode: isBuyNowMode ? "buyNow" : "cart",
    disabled:
      step !== "payment" || !resolvedAddress || !hasValidContact,
    prefetchEnabled:
      step === "payment" &&
      effectivePaymentMethod === "razorpay" &&
      Boolean(resolvedAddress) &&
      hasValidContact,
  });

  useEffect(() => {
    if (!checkoutHydrated) return;
    if (items.length === 0 && !payment.isProcessing) {
      router.replace(isBuyNowMode ? ROUTES.home : ROUTES.cart);
    }
  }, [
    checkoutHydrated,
    items.length,
    payment.isProcessing,
    router,
    isBuyNowMode,
  ]);

  async function handleContinueFromAddress() {
    setAddressError(null);

    if (!canProceedFromAddress) {
      if (!canContinueFromAddress) {
        setAddressError("Please complete all required address fields.");
      } else if (!isAuthenticated && !isValidEmail(guestEmail)) {
        setAddressError("Enter a valid email address to continue.");
      }
      return;
    }

    let shipping: ShippingAddress | null = null;
    let pendingAddressSave: Parameters<typeof createAddress>[0] | null = null;

    if (useNewAddress || savedAddresses.length === 0) {
      if (!isAddressComplete(addressDraft)) {
        setAddressError("Please complete all required address fields.");
        return;
      }
      shipping = addressDraft;

      if (isAuthenticated) {
        const alreadySaved = savedAddresses.some((addr) =>
          addressesMatch(shipping!, addressToShipping(addr))
        );

        if (!alreadySaved) {
          pendingAddressSave = {
            label: "Checkout",
            fullName: shipping.name,
            phone: shipping.phone ?? "",
            addressLine1: shipping.line1,
            ...(shipping.line2?.trim()
              ? { addressLine2: shipping.line2.trim() }
              : {}),
            city: shipping.city,
            state: shipping.state,
            postalCode: shipping.postalCode,
            country: shipping.country || "India",
            isDefault: savedAddresses.length === 0,
          };
        }
      }
    } else {
      const saved = savedAddresses.find((a) => a.id === effectiveSelectedAddressId);
      if (!saved) {
        setAddressError("Select a delivery address to continue.");
        return;
      }
      shipping = addressToShipping(saved);
    }

    setConfirmedAddress(shipping);
    trackAddShippingInfo(cartItemsToAnalyticsLines(items));
    setStep("summary");
    window.scrollTo({ top: 0, behavior: "smooth" });

    if (pendingAddressSave) {
      void createAddress(pendingAddressSave).catch((error) => {
        showToast(
          error instanceof Error
            ? `Address not saved (${error.message}). Continuing checkout.`
            : "Address not saved. Continuing checkout.",
          "info"
        );
      });
    }
  }

  function handleEditAddress() {
    setConfirmedAddress(null);
    setStep("address");
    setAddressError(null);
  }

  function handleContinueToPayment() {
    trackAddPaymentInfo(cartItemsToAnalyticsLines(items), "razorpay");
    setStep("payment");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleStepClick(target: CheckoutStep, index: number) {
    if (index >= stepIndex) return;
    if (target === "address") {
      handleEditAddress();
      return;
    }
    if (target === "summary" && confirmedAddress) {
      setStep("summary");
    }
  }

  function selectSavedAddress(addressId: string) {
    setUseNewAddressOverride(false);
    setSelectedAddressId(addressId);
    setAddressError(null);
  }

  async function handleDeleteAddress(addressId: string, event: MouseEvent) {
    event.stopPropagation();
    if (!window.confirm("Remove this address?")) return;

    const wasSelected =
      !useNewAddress &&
      (selectedAddressId === addressId || effectiveSelectedAddressId === addressId);
    const remaining = savedAddresses.filter((a) => a.id !== addressId);

    try {
      await deleteAddress(addressId);
      showToast("Address removed", "info");

      if (wasSelected) {
        setSelectedAddressId(null);
        setConfirmedAddress(null);
        if (remaining.length === 0) {
          setUseNewAddressOverride(true);
        } else {
          const next = remaining.find((a) => a.isDefault) ?? remaining[0];
          if (next) setSelectedAddressId(next.id);
        }
      } else if (selectedAddressId === addressId) {
        setSelectedAddressId(null);
      }
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : "Unable to delete address",
        "error"
      );
    }
  }

  function handleAddressCardKeyDown(
    addressId: string,
    event: KeyboardEvent<HTMLDivElement>
  ) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      selectSavedAddress(addressId);
    }
  }

  if (!checkoutHydrated || items.length === 0) {
    return (
      <div className="checkout-page checkout-page--loading" aria-busy="true">
        <div className="checkout-skeleton checkout-skeleton--title" />
        <div className="checkout-grid">
          <div className="checkout-panel">
            <div className="checkout-skeleton checkout-skeleton--line" />
            <div className="checkout-skeleton checkout-skeleton--field" />
            <div className="checkout-skeleton checkout-skeleton--field" />
            <div className="checkout-skeleton checkout-skeleton--field" />
          </div>
          <aside className="checkout-summary">
            <div className="checkout-skeleton checkout-skeleton--line" />
            <div className="checkout-skeleton checkout-skeleton--line" />
            <div className="checkout-skeleton checkout-skeleton--total" />
          </aside>
        </div>
      </div>
    );
  }

  const stepIndex = STEPS.findIndex((s) => s.id === step);

  const mobileBar =
    step !== "payment" ? (
      <div
        className={`checkout-mobile-bar${
          footerInView ? " checkout-mobile-bar--hidden" : ""
        }`}
        role="region"
        aria-label="Order total and continue"
        aria-hidden={footerInView}
      >
        <div className="checkout-mobile-bar__total">
          <span className="checkout-mobile-bar__label">Total</span>
          <strong className="checkout-mobile-bar__amount">
            {formatCurrencyPrecise(invoice.grandTotal)}
          </strong>
        </div>
        {step === "address" ? (
          <CheckoutGlassButton
            variant="solid"
            className="checkout-mobile-bar__cta"
            disabled={!canProceedFromAddress || footerInView}
            onClick={() => void handleContinueFromAddress()}
          >
            Continue
          </CheckoutGlassButton>
        ) : (
          <CheckoutGlassButton
            variant="solid"
            className="checkout-mobile-bar__cta"
            disabled={footerInView}
            onClick={handleContinueToPayment}
          >
            Continue
          </CheckoutGlassButton>
        )}
      </div>
    ) : null;

  return (
    <>
    <div className={`checkout-page checkout-page--${step}`}>
      <header className="checkout-hero">
        <div className="checkout-hero__copy storefront-page__header">
          <StorefrontBackButton fallbackHref="/cart" />
          <p className="storefront-page__eyebrow">Secure checkout</p>
          <h1 className="storefront-page__title checkout-page__title">Checkout</h1>
          <p className="storefront-page__subtitle">
            Encrypted payments via Razorpay
          </p>
        </div>

        <ol className="checkout-steps" aria-label="Checkout progress">
          {STEPS.map((s, index) => {
            const isActive = s.id === step;
            const isDone = index < stepIndex;
            return (
              <li
                key={s.id}
                className="checkout-steps__item"
                aria-current={isActive ? "step" : undefined}
              >
                <div
                  className={`checkout-step${
                    isActive
                      ? " checkout-step--active"
                      : isDone
                        ? " checkout-step--done"
                        : ""
                  }${isDone ? " checkout-step--clickable" : ""}`}
                  role={isDone ? "button" : undefined}
                  tabIndex={isDone ? 0 : undefined}
                  onClick={isDone ? () => handleStepClick(s.id, index) : undefined}
                  onKeyDown={
                    isDone
                      ? (event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            handleStepClick(s.id, index);
                          }
                        }
                      : undefined
                  }
                >
                  <span className="checkout-step__circle" aria-hidden="true">
                    {isDone ? "✓" : index + 1}
                  </span>
                  <span className="checkout-step__label">{s.label}</span>
                </div>
                {index < STEPS.length - 1 ? (
                  <span
                    className={`checkout-step__connector${
                      isDone ? " checkout-step__connector--done" : ""
                    }`}
                    aria-hidden="true"
                  />
                ) : null}
              </li>
            );
          })}
        </ol>
      </header>

      {!isAuthenticated ? (
        <div className="checkout-guest-banner" role="note">
          <p>
            Checking out as a guest.{" "}
            <Link
              href={`${ROUTES.login}?redirect=${encodeURIComponent(ROUTES.checkout)}`}
            >
              Log in
            </Link>{" "}
            or{" "}
            <Link
              href={`${ROUTES.register}?redirect=${encodeURIComponent(ROUTES.checkout)}`}
            >
              create an account
            </Link>{" "}
            to save your order history.
          </p>
        </div>
      ) : null}

      <div className="checkout-grid">
        <div
          className={`checkout-panel${
            step === "payment" ? " checkout-panel--payment-glass" : ""
          }`}
        >
          {step === "address" ? (
            <>
              <h2 className="checkout-panel__title">Delivery Address</h2>

              {savedAddresses.length > 0 ? (
                <div className="checkout-address-list">
                  {savedAddresses.map((addr) => (
                    <div
                      key={addr.id}
                      className={`checkout-address-card${
                        !useNewAddress && effectiveSelectedAddressId === addr.id
                          ? " checkout-address-card--selected"
                          : ""
                      }`}
                      role="button"
                      tabIndex={0}
                      onClick={() => selectSavedAddress(addr.id)}
                      onKeyDown={(event) => handleAddressCardKeyDown(addr.id, event)}
                      aria-pressed={
                        !useNewAddress && effectiveSelectedAddressId === addr.id
                      }
                      aria-label={`Select ${getAddressDisplayLabel(addr)}`}
                    >
                      <div className="checkout-address-card__head">
                        <div className="checkout-address-card__label">
                          {getAddressDisplayLabel(addr)}
                          {addr.isDefault ? " (Default)" : ""}
                        </div>
                        <button
                          type="button"
                          className="checkout-address-card__delete"
                          onClick={(event) => void handleDeleteAddress(addr.id, event)}
                          disabled={isDeleting}
                          aria-label={`Remove ${getAddressDisplayLabel(addr)}`}
                        >
                          <Trash2 size={16} aria-hidden="true" />
                        </button>
                      </div>
                      <div className="checkout-address-card__text">
                        {addr.fullName}
                        {"\n"}
                        {addr.addressLine1}
                        {addr.addressLine2 ? `, ${addr.addressLine2}` : ""}
                        {"\n"}
                        {addr.city}, {addr.state} {addr.postalCode}
                        {"\n"}
                        {addr.phone}
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}

              {isAuthenticated ? (
                <button
                  type="button"
                  className={`checkout-address-toggle${
                    useNewAddress ? " checkout-address-toggle--active" : ""
                  }`}
                  onClick={() => {
                    setUseNewAddressOverride(true);
                    setSelectedAddressId(null);
                  }}
                >
                  {useNewAddress ? "Adding new address" : "+ Add new address"}
                </button>
              ) : null}

              {useNewAddress || savedAddresses.length === 0 ? (
                <form
                  className="checkout-form"
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleContinueFromAddress();
                  }}
                >
                  <label>
                    Full Name
                    <input
                      required
                      autoComplete="name"
                      value={addressForm.name}
                      onChange={(e) =>
                        setAddressForm((p) => ({ ...p, name: e.target.value }))
                      }
                      placeholder={user?.name || "Your full name"}
                    />
                  </label>
                  <label>
                    Address Line 1
                    <AddressAutocompleteField
                      required
                      autocompleteAvailable={placesAutocomplete}
                      value={addressForm.line1}
                      onChange={(line1) =>
                        setAddressForm((p) => ({ ...p, line1 }))
                      }
                      onResolvedAddress={(resolved) => {
                        setAddressForm((p) => ({
                          ...p,
                          line1: resolved.line1 || p.line1,
                          line2: resolved.line2 || p.line2,
                          city: resolved.city || p.city,
                          state: resolved.state || p.state,
                          postalCode: resolved.postalCode || p.postalCode,
                          country: resolved.country || p.country || "India",
                        }));
                      }}
                    />
                  </label>
                  <label>
                    Address Line 2
                    <input
                      value={addressForm.line2 ?? ""}
                      onChange={(e) =>
                        setAddressForm((p) => ({ ...p, line2: e.target.value }))
                      }
                    />
                  </label>
                  <div className="checkout-form__row">
                    <label>
                      City
                      <input
                        required
                        value={addressForm.city}
                        onChange={(e) =>
                          setAddressForm((p) => ({ ...p, city: e.target.value }))
                        }
                      />
                    </label>
                    <label>
                      PIN Code
                      <input
                        required
                        inputMode="numeric"
                        pattern="[0-9]{6}"
                        autoComplete="postal-code"
                        value={addressForm.postalCode}
                        onChange={(e) =>
                          setAddressForm((p) => ({
                            ...p,
                            postalCode: e.target.value,
                          }))
                        }
                      />
                    </label>
                  </div>
                  <label>
                    Phone
                    <input
                      required
                      type="tel"
                      inputMode="tel"
                      autoComplete="tel"
                      pattern="[0-9]{10}"
                      value={addressForm.phone ?? ""}
                      onChange={(e) =>
                        setAddressForm((p) => ({ ...p, phone: e.target.value }))
                      }
                    />
                  </label>
                  {!isAuthenticated ? (
                    <label>
                      Email
                      <input
                        required
                        type="email"
                        autoComplete="email"
                        value={guestEmail}
                        onChange={(e) => setGuestEmailInput(e.target.value)}
                      />
                    </label>
                  ) : (
                    <label>
                      Email
                      <input
                        type="email"
                        value={email}
                        readOnly
                        disabled
                      />
                    </label>
                  )}
                  <label>
                    State
                    <select
                      required
                      value={addressForm.state}
                      onChange={(e) =>
                        setAddressForm((p) => ({ ...p, state: e.target.value }))
                      }
                    >
                      {INDIAN_STATES.map((state) => (
                        <option key={state} value={state}>
                          {state}
                        </option>
                      ))}
                    </select>
                  </label>
                </form>
              ) : null}

              {addressError ? (
                <p className="checkout-panel__alert" role="alert">
                  {addressError}
                </p>
              ) : null}

              <div className="checkout-actions">
                <CheckoutGlassButton href={ROUTES.cart} variant="ghost">
                  Back to Cart
                </CheckoutGlassButton>
                <CheckoutGlassButton
                  disabled={!canProceedFromAddress}
                  onClick={() => void handleContinueFromAddress()}
                  variant="solid"
                >
                  Continue to Review
                </CheckoutGlassButton>
              </div>
            </>
          ) : null}

          {step === "summary" ? (
            <>
              <h2 className="checkout-panel__title">Review Your Order</h2>
              <p className="checkout-panel__lead">
                Confirm your items and delivery details before payment.
              </p>
              <div className="checkout-items">
                {items.map((item) => (
                  <div key={item.lineId} className="checkout-item">
                    {item.image ? (
                      <StorefrontThumbImage
                        src={item.image}
                        className="checkout-item__thumb"
                        width={56}
                        height={56}
                      />
                    ) : (
                      <div
                        className="checkout-item__thumb"
                        style={{ background: item.imageColor ?? "#eee" }}
                      />
                    )}
                    <div>
                      <strong>{item.name}</strong>
                      <div>Qty: {item.quantity}</div>
                    </div>
                    <div>{formatCurrencyPrecise(item.price * item.quantity)}</div>
                  </div>
                ))}
              </div>

              {resolvedAddress ? (
                <div className="checkout-review-address">
                  <div className="checkout-review-address__label">Deliver to</div>
                  <p>
                    <strong>{resolvedAddress.name}</strong>
                    <br />
                    {resolvedAddress.line1}
                    {resolvedAddress.line2 ? `, ${resolvedAddress.line2}` : ""}
                    <br />
                    {resolvedAddress.city}, {resolvedAddress.state}{" "}
                    {resolvedAddress.postalCode}
                    <br />
                    {resolvedAddress.phone}
                  </p>
                </div>
              ) : null}

              <div className="checkout-actions">
                <CheckoutGlassButton onClick={handleEditAddress} variant="ghost">
                  Edit Address
                </CheckoutGlassButton>
                <CheckoutGlassButton onClick={handleContinueToPayment} variant="solid">
                  Continue to Payment
                </CheckoutGlassButton>
              </div>
            </>
          ) : null}

          {step === "payment" ? (
            <>
              <h2 className="checkout-panel__title">Payment Method</h2>
              <p className="checkout-panel__lead">
                Choose how you&apos;d like to pay. All online payments are
                processed securely through Razorpay.
              </p>

              <CheckoutPaymentMethods
                onlineChannel={onlineChannel}
                onlinePaymentsAvailable={onlinePaymentsAvailable}
                onOnlineChannelChange={setOnlineChannel}
                onPaymentMethodChange={() => undefined}
                paymentMethod={effectivePaymentMethod}
              />

              {!onlinePaymentsAvailable ? (
                <p className="checkout-panel__alert" role="alert">
                  <strong>Online payments unavailable:</strong> Razorpay is not
                  configured on this store. Please contact support to complete
                  your order.
                </p>
              ) : null}

              {demoPaymentsLikely && effectivePaymentMethod === "razorpay" ? (
                <p className="checkout-panel__alert" role="note">
                  <strong>Demo mode:</strong> Razorpay keys are not configured.
                  Payment will be simulated — your order and invoice are still
                  created.
                </p>
              ) : null}

              {!resolvedAddress || !hasValidContact ? (
                <p className="checkout-panel__alert" role="alert">
                  {!resolvedAddress
                    ? "Delivery address is missing. Go back to the address step."
                    : "Enter a valid email address to continue."}
                </p>
              ) : null}

              <div className="checkout-actions checkout-actions--payment">
                <CheckoutGlassButton
                  onClick={() => setStep("summary")}
                  variant="ghost"
                >
                  Back to Review
                </CheckoutGlassButton>
              </div>
            </>
          ) : null}
        </div>

        <CheckoutSummary
          buyerState={buyerState}
          couponDiscount={couponDiscount}
          displayItems={displayItems}
          items={checkoutItems}
          shippingMethod={shippingMethod}
          shippingChargeOverride={activeShippingCharge}
          paymentAction={
            step === "payment" && resolvedAddress && hasValidContact
              ? {
                  onPay: payment.pay,
                  disabled: payment.isDisabled,
                  loading: payment.isProcessing || payment.isLoading,
                  loadingLabel:
                    payment.processingLabel ??
                    (payment.isLoading ? "Opening Razorpay…" : undefined),
                  paymentMethod: effectivePaymentMethod,
                  error: payment.error,
                }
              : undefined
          }
          showLineItems
          showPromo
        />
      </div>

    </div>
    {mobileBarReady && mobileBar
      ? createPortal(mobileBar, document.body)
      : null}
    </>
  );
}
