"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import CheckoutSummary from "@/components/checkout/CheckoutSummary";
import PaymentButton from "@/components/checkout/PaymentButton";
import { ROUTES } from "@/lib/routes";
import { DEFAULT_GST_RATE } from "@/lib/gstCalculator";
import { useAccountProfileStore } from "@/store/accountProfileStore";
import { useAuthStore } from "@/store/authStore";
import { useCartStore } from "@/store/cartStore";
import { formatCurrencyPrecise } from "@/utils/currency";
import type { SavedAddress } from "@/store/accountProfileStore";
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

function savedToShipping(address: SavedAddress, phone: string): ShippingAddress {
  return {
    name: address.name,
    line1: address.line1,
    line2: address.line2,
    city: address.city,
    state: address.state,
    postalCode: address.postalCode,
    country: address.country,
    phone,
  };
}

function isAddressComplete(address: ShippingAddress): boolean {
  return Boolean(
    address.name.trim() &&
      address.line1.trim() &&
      address.city.trim() &&
      address.state.trim() &&
      address.postalCode.trim()
  );
}

export default function CheckoutPageContent() {
  const router = useRouter();
  const items = useCartStore((s) => s.items);
  const couponDiscount = useCartStore((s) => s.discount());
  const user = useAuthStore((s) => s.user);
  const phone = useAccountProfileStore((s) => s.phone);
  const addresses = useAccountProfileStore((s) => s.addresses);
  const addAddress = useAccountProfileStore((s) => s.addAddress);

  const [step, setStep] = useState<CheckoutStep>("address");
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(
    null
  );
  const [useNewAddress, setUseNewAddress] = useState(false);
  const [addressForm, setAddressForm] = useState<ShippingAddress>(EMPTY_ADDRESS);
  const [confirmedAddress, setConfirmedAddress] =
    useState<ShippingAddress | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<"razorpay" | "cod">(
    "razorpay"
  );

  const defaultAddress = useMemo(
    () => addresses.find((a) => a.isDefault) ?? addresses[0] ?? null,
    [addresses]
  );

  useEffect(() => {
    if (addresses.length === 0) {
      setUseNewAddress(true);
    }
  }, [addresses.length]);

  useEffect(() => {
    if (defaultAddress && !selectedAddressId && !useNewAddress) {
      setSelectedAddressId(defaultAddress.id);
    }
  }, [defaultAddress, selectedAddressId, useNewAddress]);

  useEffect(() => {
    if (items.length === 0) {
      router.replace(ROUTES.cart);
    }
  }, [items.length, router]);

  useEffect(() => {
    if (user?.name && !addressForm.name) {
      setAddressForm((prev) => ({
        ...prev,
        name: user.name ?? prev.name,
      }));
    }
  }, [user?.name, addressForm.name]);

  const checkoutItems = items.map((item) => ({
    productId: item.productId,
    name: item.name,
    quantity: item.quantity,
    price: item.price,
    gstRate: item.gstRate ?? DEFAULT_GST_RATE,
  }));

  const resolvedAddress: ShippingAddress | null = useMemo(() => {
    if (confirmedAddress) {
      return confirmedAddress;
    }

    if (useNewAddress || addresses.length === 0) {
      return isAddressComplete(addressForm)
        ? { ...addressForm, phone: phone || addressForm.phone }
        : null;
    }

    const saved = addresses.find((a) => a.id === selectedAddressId);
    if (!saved) return null;
    return savedToShipping(saved, phone);
  }, [
    confirmedAddress,
    useNewAddress,
    addressForm,
    addresses,
    selectedAddressId,
    phone,
  ]);

  const buyerState = resolvedAddress?.state ?? "Maharashtra";
  const email = user?.email ?? "";

  const canContinueFromAddress =
    Boolean(confirmedAddress) ||
    Boolean(!useNewAddress && selectedAddressId) ||
    isAddressComplete(addressForm);

  function handleContinueFromAddress() {
    let shipping: ShippingAddress | null = null;

    if (useNewAddress || addresses.length === 0) {
      if (!isAddressComplete(addressForm)) return;
      shipping = { ...addressForm, phone: phone || addressForm.phone };
      addAddress({
        label: "Checkout Address",
        name: addressForm.name,
        line1: addressForm.line1,
        line2: addressForm.line2,
        city: addressForm.city,
        state: addressForm.state,
        postalCode: addressForm.postalCode,
        country: addressForm.country,
        isDefault: addresses.length === 0,
      });
    } else {
      const saved = addresses.find((a) => a.id === selectedAddressId);
      if (!saved) return;
      shipping = savedToShipping(saved, phone);
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

              {addresses.length > 0 ? (
                <div className="checkout-address-list">
                  {addresses.map((addr) => (
                    <button
                      key={addr.id}
                      type="button"
                      className={`checkout-address-card${
                        !useNewAddress && selectedAddressId === addr.id
                          ? " checkout-address-card--selected"
                          : ""
                      }`}
                      onClick={() => {
                        setUseNewAddress(false);
                        setSelectedAddressId(addr.id);
                      }}
                    >
                      <div className="checkout-address-card__label">
                        {addr.label}
                        {addr.isDefault ? " (Default)" : ""}
                      </div>
                      <div className="checkout-address-card__text">
                        {addr.name}
                        {"\n"}
                        {addr.line1}
                        {addr.line2 ? `, ${addr.line2}` : ""}
                        {"\n"}
                        {addr.city}, {addr.state} {addr.postalCode}
                      </div>
                    </button>
                  ))}
                </div>
              ) : null}

              <button
                type="button"
                className="cart-btn cart-btn--secondary"
                onClick={() => {
                  setUseNewAddress(true);
                  setSelectedAddressId(null);
                }}
              >
                {useNewAddress ? "Adding new address" : "+ Add new address"}
              </button>

              {useNewAddress || addresses.length === 0 ? (
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
                      value={addressForm.name}
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
                  disabled={!canContinueFromAddress}
                >
                  Continue to Summary
                </button>
              </div>
            </>
          ) : null}

          {step === "summary" ? (
            <>
              <h2 className="checkout-panel__title">Review Your Order</h2>

              <div className="checkout-items">
                {items.map((item) => (
                  <div key={item.productId} className="checkout-item">
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

              {resolvedAddress && email ? (
                <PaymentButton
                  items={checkoutItems}
                  shippingAddress={resolvedAddress}
                  buyerState={buyerState}
                  email={email}
                  phone={phone || undefined}
                  paymentMethod={paymentMethod}
                />
              ) : (
                <p role="alert">
                  {!resolvedAddress
                    ? "Delivery address is missing. Go back to the address step."
                    : "Account email is missing. Update your profile or sign in again."}
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
