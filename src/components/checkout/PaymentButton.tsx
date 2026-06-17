"use client";

import { useCheckoutPayment, type UseCheckoutPaymentOptions } from "@/hooks/useCheckoutPayment";

export type PaymentButtonProps = UseCheckoutPaymentOptions;

export default function PaymentButton(props: PaymentButtonProps) {
  const { pay, isProcessing, isLoading, isDisabled, error, paymentMethod } =
    useCheckoutPayment(props);

  const label =
    paymentMethod === "cod"
      ? isProcessing
        ? "Placing order…"
        : "Place Order (Cash on Delivery)"
      : isProcessing || isLoading
        ? "Processing…"
        : "Pay Securely";

  return (
    <div className="payment-button">
      <button
        type="button"
        className="cart-btn cart-btn--checkout payment-button__primary"
        onClick={() => void pay()}
        disabled={isDisabled}
      >
        {label}
      </button>

      {paymentMethod === "razorpay" ? (
        <p className="payment-button__methods">
          UPI · Cards · Net Banking · Wallets
        </p>
      ) : null}

      {error ? (
        <p className="payment-button__error" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
