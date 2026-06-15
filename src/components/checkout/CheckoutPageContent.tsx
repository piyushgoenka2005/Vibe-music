"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import CheckoutSummary from "@/components/checkout/CheckoutSummary";
import PaymentButton from "@/components/checkout/PaymentButton";
import {
  addressToShipping,
  getAddressDisplayLabel,
} from "@/lib/address/addressMappers";
import { ROUTES } from "@/lib/routes";
import { DEFAULT_GST_RATE } from "@/lib/gstCalculator";
import { useAddresses } from "@/hooks/useAddresses";
import { useAccountProfileStore } from "@/store/accountProfileStore";
import { useAuthStore } from "@/store/authStore";
import { useCartStore } from "@/store/cartStore";
import { formatCurrencyPrecise } from "@/utils/currency";
import type { ShippingAddress } from "@/types/order";
import "@/components/checkout/checkout.css";

const INDIAN_STATES = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  "Delhi",
  "Jammu and Kashmir",
  "Ladakh",
  "Puducherry",
] as const;

type CheckoutStep = "address" | "summary" | "payment";

const STEPS: Array<{ id: CheckoutStep; label: string }> = [
  { id: "address", label: "Address" },
  { id: "summary", label: "Order Summary" },
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

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export default function CheckoutPageContent() {
  const router = useRouter();
  const items = useCartStore((s) => s.items);
  const couponDiscount = useCartStore((s) => s.discount());
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const phone = useAccountProfileStore((s) => s.phone);
  const {
    addresses,
    defaultAddress,
    isLoading: addressesLoading,
    createAddress,
  } = useAddresses();

  const [step, setStep] = useState<CheckoutStep>("address");
  const savedAddresses = isAuthenticated ? addresses : [];
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
  const [paymentMethod, setPaymentMethod] = useState<"razorpay" | "cod">(
    "razorpay"
  );
  const [guestEmailInput, setGuestEmailInput] = useState("");
  const guestEmail = guestEmailInput || user?.email || "";
  const [isSavingAddress, setIsSavingAddress] = useState(false);

  useEffect(() => {
    if (items.length === 0) {
      router.replace(ROUTES.cart);
    }
  }, [items.length, router]);

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

  const resolvedAddress: ShippingAddress | null = useMemo(() => {
    if (confirmedAddress) {
      return confirmedAddress;
    }

    if (useNewAddress || savedAddresses.length === 0) {
      return isAddressComplete({
        ...addressForm,
        phone: addressForm.phone || phone,
      })
        ? { ...addressForm, phone: addressForm.phone || phone }
        : null;
    }

    const saved = savedAddresses.find((a) => a.id === effectiveSelectedAddressId);
    if (!saved) return null;
    return addressToShipping(saved);
  }, [
    confirmedAddress,
    useNewAddress,
    addressForm,
    savedAddresses,
    effectiveSelectedAddressId,
    phone,
  ]);

  const buyerState = resolvedAddress?.state ?? "Maharashtra";
  const email = (user?.email ?? guestEmail).trim().toLowerCase();
  const contactPhone = resolvedAddress?.phone || phone || "";

  const canContinueFromAddress =
    Boolean(confirmedAddress) ||
    Boolean(!useNewAddress && effectiveSelectedAddressId) ||
    isAddressComplete({ ...addressForm, phone: addressForm.phone || phone });

  const hasValidContact = isAuthenticated
    ? Boolean(email)
    : Boolean(email && isValidEmail(email));

  async function handleContinueFromAddress() {
    let shipping: ShippingAddress | null = null;

    if (useNewAddress || savedAddresses.length === 0) {
      if (!isAddressComplete({ ...addressForm, phone: addressForm.phone || phone })) {
        return;
      }
      shipping = {
        ...addressForm,
        phone: addressForm.phone || phone,
      };

      if (isAuthenticated) {
        setIsSavingAddress(true);
        try {
          await createAddress({
            label: "Checkout",
            fullName: shipping.name,
            phone: shipping.phone ?? "",
            addressLine1: shipping.line1,
            addressLine2: shipping.line2,
            city: shipping.city,
            state: shipping.state,
            postalCode: shipping.postalCode,
            country: shipping.country,
            isDefault: savedAddresses.length === 0,
          });
        } finally {
          setIsSavingAddress(false);
        }
      }
    } else {
      const saved = savedAddresses.find((a) => a.id === effectiveSelectedAddressId);
      if (!saved) return;
      shipping = addressToShipping(saved);
    }

    setConfirmedAddress(shipping);
    setStep("summary");
  }

  function handleEditAddress() {
    setConfirmedAddress(null);
    setStep("address");
  }

  if (items.length === 0) {
    return null;
  }

  const stepIndex = STEPS.findIndex((s) => s.id === step);

  return (
    <div className="checkout-page">
      <h1 className="personalization-widgets__greeting">Checkout</h1>

      {!isAuthenticated ? (
        <p style={{ marginBottom: 16, fontSize: 14, color: "#666" }}>
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
      ) : null}

      <div className="checkout-steps" aria-label="Checkout progress">
        {STEPS.map((s, index) => (
          <span
            key={s.id}
            className={`checkout-step${
              s.id === step
                ? " checkout-step--active"
                : index < stepIndex
                  ? " checkout-step--done"
                  : ""
            }`}
          >
            {index + 1}. {s.label}
          </span>
        ))}
      </div>

      <div className="checkout-grid">
        <div className="checkout-panel">
          {step === "address" ? (
            <>
              <h2 className="checkout-panel__title">Delivery Address</h2>

              {isAuthenticated && addressesLoading ? (
                <p>Loading saved addresses…</p>
              ) : null}

              {savedAddresses.length > 0 ? (
                <div className="checkout-address-list">
                  {savedAddresses.map((addr) => (
                    <button
                      key={addr.id}
                      type="button"
                      className={`checkout-address-card${
                        !useNewAddress && effectiveSelectedAddressId === addr.id
                          ? " checkout-address-card--selected"
                          : ""
                      }`}
                      onClick={() => {
                        setUseNewAddressOverride(false);
                        setSelectedAddressId(addr.id);
                      }}
                    >
                      <div className="checkout-address-card__label">
                        {getAddressDisplayLabel(addr)}
                        {addr.isDefault ? " (Default)" : ""}
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
                    </button>
                  ))}
                </div>
              ) : null}

              {isAuthenticated ? (
                <button
                  type="button"
                  className="cart-btn cart-btn--secondary"
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
                      value={addressForm.name || user?.name || ""}
                      onChange={(e) =>
                        setAddressForm((p) => ({ ...p, name: e.target.value }))
                      }
                    />
                  </label>
                  <label>
                    Address Line 1
                    <input
                      required
                      value={addressForm.line1}
                      onChange={(e) =>
                        setAddressForm((p) => ({ ...p, line1: e.target.value }))
                      }
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
                        pattern="[0-9]{6}"
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

              <div className="checkout-actions">
                <Link href={ROUTES.cart} className="cart-btn cart-btn--secondary">
                  Back to Cart
                </Link>
                <button
                  type="button"
                  className="cart-btn cart-btn--checkout"
                  onClick={handleContinueFromAddress}
                  disabled={!canContinueFromAddress || isSavingAddress}
                >
                  {isSavingAddress ? "Saving address…" : "Continue to Summary"}
                </button>
              </div>
            </>
          ) : null}

          {step === "summary" ? (
            <>
              <h2 className="checkout-panel__title">Review Your Order</h2>

              <div className="checkout-items">
                {items.map((item) => (
                  <div key={item.lineId} className="checkout-item">
                    {item.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.image}
                        alt=""
                        className="checkout-item__thumb"
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
                      <div>GST: {item.gstRate}%</div>
                    </div>
                    <div>{formatCurrencyPrecise(item.price * item.quantity)}</div>
                  </div>
                ))}
              </div>

              {resolvedAddress ? (
                <div style={{ marginBottom: 16, fontSize: 14 }}>
                  <strong>Deliver to:</strong>
                  <br />
                  {resolvedAddress.name}, {resolvedAddress.line1},{" "}
                  {resolvedAddress.city}, {resolvedAddress.state}{" "}
                  {resolvedAddress.postalCode}
                </div>
              ) : null}

              <div className="checkout-actions">
                <button
                  type="button"
                  className="cart-btn cart-btn--secondary"
                  onClick={handleEditAddress}
                >
                  Edit Address
                </button>
                <button
                  type="button"
                  className="cart-btn cart-btn--checkout"
                  onClick={() => setStep("payment")}
                >
                  Continue to Payment
                </button>
              </div>
            </>
          ) : null}

          {step === "payment" ? (
            <>
              <h2 className="checkout-panel__title">Payment Method</h2>

              <div className="checkout-payment-toggle">
                <label
                  className={`checkout-payment-option${
                    paymentMethod === "razorpay"
                      ? " checkout-payment-option--selected"
                      : ""
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    checked={paymentMethod === "razorpay"}
                    onChange={() => setPaymentMethod("razorpay")}
                  />
                  <span>
                    <strong>Pay Online</strong>
                    <br />
                    UPI, Credit/Debit Cards, Net Banking, Wallets
                  </span>
                </label>

                <label
                  className={`checkout-payment-option${
                    paymentMethod === "cod"
                      ? " checkout-payment-option--selected"
                      : ""
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    checked={paymentMethod === "cod"}
                    onChange={() => setPaymentMethod("cod")}
                  />
                  <span>
                    <strong>Cash on Delivery (COD)</strong>
                    <br />
                    Pay when your order arrives
                  </span>
                </label>
              </div>

              {resolvedAddress && hasValidContact ? (
                <PaymentButton
                  items={checkoutItems}
                  shippingAddress={resolvedAddress}
                  buyerState={buyerState}
                  email={email}
                  customerName={resolvedAddress.name}
                  customerPhone={contactPhone}
                  phone={contactPhone || undefined}
                  paymentMethod={paymentMethod}
                />
              ) : (
                <p role="alert">
                  {!resolvedAddress
                    ? "Delivery address is missing. Go back to the address step."
                    : "Enter a valid email address to continue."}
                </p>
              )}

              <div className="checkout-actions">
                <button
                  type="button"
                  className="cart-btn cart-btn--secondary"
                  onClick={() => setStep("summary")}
                >
                  Back to Summary
                </button>
              </div>
            </>
          ) : null}
        </div>

        <CheckoutSummary
          items={checkoutItems}
          couponDiscount={couponDiscount}
          buyerState={buyerState}
        />
      </div>
    </div>
  );
}
