"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BRAND } from "@/lib/brand";
import { useRazorpay } from "@/hooks/useRazorpay";
import {
  createCodOrder,
  createPaymentOrder,
  verifyPayment,
} from "@/services/orderService";
import { useCartStore } from "@/store/cartStore";
import { useToastStore } from "@/store/toastStore";
import type { CreateOrderPayload, ShippingAddress } from "@/types/order";
import type { CheckoutSummaryItem } from "@/components/checkout/CheckoutSummary";

export interface PaymentButtonProps {
  items: CheckoutSummaryItem[];
  shippingAddress: ShippingAddress;
  buyerState: string;
  email: string;
  phone?: string;
  paymentMethod: "razorpay" | "cod";
  disabled?: boolean;
}

export default function PaymentButton({
  items,
  shippingAddress,
  buyerState,
  email,
  phone,
  paymentMethod,
  disabled = false,
}: PaymentButtonProps) {
  const router = useRouter();
  const { isReady, isLoading, error, openCheckout } = useRazorpay();
  const [isProcessing, setIsProcessing] = useState(false);

  const couponCode = useCartStore((s) => s.couponCode);
  const couponDiscount = useCartStore((s) => s.discount());
  const clearCart = useCartStore((s) => s.clearCart);
  const showToast = useToastStore((s) => s.show);

  const isDisabled =
    disabled || isProcessing || isLoading || (paymentMethod === "razorpay" && !isReady);

  async function buildPayload(): Promise<CreateOrderPayload> {
    return {
      items: items.map((item) => ({
        productId: item.productId,
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        gstRate: item.gstRate,
      })),
      email,
      couponCode,
      couponDiscount,
      shippingAddress,
      paymentMethod,
      buyerState,
    };
  }

  async function handleCodPayment() {
    setIsProcessing(true);
    try {
      const payload = await buildPayload();
      const { orderId } = await createCodOrder(payload);
      clearCart();
      showToast("Order placed successfully!", "success");
      router.push(`/checkout/success?orderId=${orderId}`);
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Unable to place COD order",
        "error"
      );
    } finally {
      setIsProcessing(false);
    }
  }

  async function handleRazorpayPayment() {
    setIsProcessing(true);
    try {
      const payload = await buildPayload();
      const orderResponse = await createPaymentOrder(payload);

      const response = await openCheckout({
        key: orderResponse.keyId,
        amount: orderResponse.amount,
        currency: orderResponse.currency,
        name: BRAND.name,
        description: "Secure payment for your order",
        order_id: orderResponse.razorpayOrderId,
        prefill: {
          name: shippingAddress.name,
          email,
          contact: phone,
        },
        notes: {
          orderId: orderResponse.orderId,
        },
        theme: { color: "#0072ba" },
        handler: () => {},
      });

      if (!response) {
        showToast("Payment cancelled or failed", "error");
        return;
      }

      await verifyPayment({
        orderId: orderResponse.orderId,
        razorpayOrderId: response.razorpay_order_id,
        razorpayPaymentId: response.razorpay_payment_id,
        razorpaySignature: response.razorpay_signature,
      });

      clearCart();
      showToast("Payment successful!", "success");
      router.push(`/checkout/success?orderId=${orderResponse.orderId}`);
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Payment failed",
        "error"
      );
    } finally {
      setIsProcessing(false);
    }
  }

  async function handlePay() {
    if (paymentMethod === "cod") {
      await handleCodPayment();
    } else {
      await handleRazorpayPayment();
    }
  }

  const label =
    paymentMethod === "cod"
      ? isProcessing
        ? "Placing order..."
        : "Place Order (Cash on Delivery)"
      : isProcessing || isLoading
        ? "Processing..."
        : "Pay Securely with Razorpay";

  return (
    <div className="payment-button">
      <button
        type="button"
        className="cart-btn cart-btn--checkout"
        onClick={handlePay}
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
