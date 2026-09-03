"use client";

/**
 * Lightweight sub-components for each checkout step.
 * These receive their data via props and handle only the rendering.
 * All business logic stays in CheckoutPageContent.
 */
import { Trash2 } from "lucide-react";
import type { KeyboardEvent, MouseEvent } from "react";
import CheckoutGlassButton from "@/components/checkout/CheckoutGlassButton";
import CheckoutPaymentMethods from "@/components/checkout/CheckoutPaymentMethods";
import StorefrontThumbImage from "@/components/common/StorefrontThumbImage";
import AddressAutocompleteField from "@/components/checkout/AddressAutocompleteField";
import { INDIAN_STATES } from "@/lib/address/indianStates";
import { getAddressDisplayLabel } from "@/lib/address/addressMappers";
import { ROUTES } from "@/lib/routes";
import { formatCurrencyPrecise } from "@/utils/currency";
import type { ShippingAddress } from "@/types/order";
import type { Address } from "@/types/address";
import type { OnlinePaymentChannel } from "@/components/checkout/CheckoutPaymentMethods";

/* ------------------------------------------------------------------ */
/*  Address Step                                                       */
/* ------------------------------------------------------------------ */

interface AddressStepProps {
  addressForm: ShippingAddress;
  setAddressForm: React.Dispatch<React.SetStateAction<ShippingAddress>>;
  savedAddresses: Address[];
  effectiveSelectedAddressId: string | null;
  useNewAddress: boolean;
  setUseNewAddressOverride: (v: boolean | null) => void;
  setSelectedAddressId: (id: string | null) => void;
  user: { name?: string | null; email?: string | null } | null;
  isAuthenticated: boolean;
  guestEmail: string;
  setGuestEmailInput: (v: string) => void;
  addressError: string | null;
  placesAutocomplete: boolean;
  onContinue: () => void;
  onSelectAddress: (id: string) => void;
  onDeleteAddress: (id: string, event: MouseEvent) => void;
}

export function AddressStep({
  addressForm,
  setAddressForm,
  savedAddresses,
  effectiveSelectedAddressId,
  useNewAddress,
  setUseNewAddressOverride,
  setSelectedAddressId,
  user,
  isAuthenticated,
  guestEmail,
  setGuestEmailInput,
  addressError,
  placesAutocomplete,
  onContinue,
  onSelectAddress,
  onDeleteAddress,
}: AddressStepProps) {
  function handleAddressCardKeyDown(addressId: string, event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onSelectAddress(addressId);
    }
  }

  const email = (user?.email ?? guestEmail ?? "").trim();

  return (
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
              onClick={() => onSelectAddress(addr.id)}
              onKeyDown={(e) => handleAddressCardKeyDown(addr.id, e)}
              aria-pressed={!useNewAddress && effectiveSelectedAddressId === addr.id}
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
                  onClick={(e) => onDeleteAddress(addr.id, e)}
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
          className={`checkout-address-toggle${useNewAddress ? " checkout-address-toggle--active" : ""}`}
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
            onContinue();
          }}
        >
          <label>
            Full Name
            <input
              required
              autoComplete="name"
              value={addressForm.name}
              onChange={(e) => setAddressForm((p) => ({ ...p, name: e.target.value }))}
              placeholder={user?.name || "Your full name"}
            />
          </label>
          <label>
            Address Line 1
            <AddressAutocompleteField
              required
              autocompleteAvailable={placesAutocomplete}
              value={addressForm.line1}
              onChange={(line1) => setAddressForm((p) => ({ ...p, line1 }))}
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
              onChange={(e) => setAddressForm((p) => ({ ...p, line2: e.target.value }))}
            />
          </label>
          <div className="checkout-form__row">
            <label>
              City
              <input
                required
                value={addressForm.city}
                onChange={(e) => setAddressForm((p) => ({ ...p, city: e.target.value }))}
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
                onChange={(e) => setAddressForm((p) => ({ ...p, postalCode: e.target.value }))}
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
              onChange={(e) => setAddressForm((p) => ({ ...p, phone: e.target.value }))}
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
              <input type="email" value={email} readOnly disabled />
            </label>
          )}
          <label>
            State
            <select
              required
              value={addressForm.state}
              onChange={(e) => setAddressForm((p) => ({ ...p, state: e.target.value }))}
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
        <CheckoutGlassButton onClick={onContinue} variant="solid">
          Continue to Review
        </CheckoutGlassButton>
      </div>
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Review Step                                                        */
/* ------------------------------------------------------------------ */

interface ReviewStepProps {
  items: Array<{
    lineId: string;
    name: string;
    quantity: number;
    price: number;
    image?: string | null;
    imageColor?: string | null;
  }>;
  resolvedAddress: ShippingAddress | null;
  onEditAddress: () => void;
  onContinueToPayment: () => void;
}

export function ReviewStep({
  items,
  resolvedAddress,
  onEditAddress,
  onContinueToPayment,
}: ReviewStepProps) {
  return (
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
            {resolvedAddress.city}, {resolvedAddress.state} {resolvedAddress.postalCode}
            <br />
            {resolvedAddress.phone}
          </p>
        </div>
      ) : null}

      <div className="checkout-actions">
        <CheckoutGlassButton onClick={onEditAddress} variant="ghost">
          Edit Address
        </CheckoutGlassButton>
        <CheckoutGlassButton onClick={onContinueToPayment} variant="solid">
          Continue to Payment
        </CheckoutGlassButton>
      </div>
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Payment Step                                                       */
/* ------------------------------------------------------------------ */

interface PaymentStepProps {
  onlineChannel: OnlinePaymentChannel;
  setOnlineChannel: (ch: OnlinePaymentChannel) => void;
  effectivePaymentMethod: "razorpay";
  onlinePaymentsAvailable: boolean;
  demoPaymentsLikely: boolean;
  resolvedAddress: ShippingAddress | null;
  hasValidContact: boolean;
  onBackToReview: () => void;
}

export function PaymentStep({
  onlineChannel,
  setOnlineChannel,
  effectivePaymentMethod,
  onlinePaymentsAvailable,
  demoPaymentsLikely,
  resolvedAddress,
  hasValidContact,
  onBackToReview,
}: PaymentStepProps) {
  return (
    <>
      <h2 className="checkout-panel__title">Payment Method</h2>
      <p className="checkout-panel__lead">
        Choose how you&apos;d like to pay. All online payments are processed securely through
        Razorpay.
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
          <strong>Online payments unavailable:</strong> Razorpay is not configured on this store.
          Please contact support to complete your order.
        </p>
      ) : null}

      {demoPaymentsLikely && effectivePaymentMethod === "razorpay" ? (
        <p className="checkout-panel__alert" role="note">
          <strong>Demo mode:</strong> Razorpay keys are not configured. Payment will be simulated —
          your order and invoice are still created.
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
        <CheckoutGlassButton onClick={onBackToReview} variant="ghost">
          Back to Review
        </CheckoutGlassButton>
      </div>
    </>
  );
}
