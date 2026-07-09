"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { BRAND } from "@/lib/brand";
import { cacheOrderForConfirmation } from "@/lib/checkout/orderConfirmationCache";
import { useRazorpay } from "@/hooks/useRazorpay";
import {
  completeDemoPayment,
  resumePayment,
  verifyPayment,
} from "@/services/orderService";
import { useToastStore } from "@/store/toastStore";
import { formatCurrencyPrecise } from "@/utils/currency";
import type { Order } from "@/types/order";
import "@/components/checkout/checkout.css";

export interface ResumePaymentClientProps {
  order: Order;
  email: string;
  demoMode: boolean;
}

export function ResumePaymentClient({
  order,
  email,
  demoMode,
}: ResumePaymentClientProps) {
  const router = useRouter();
  const { isReady, isLoading, openCheckout } = useRazorpay();
  const showToast = useToastStore((s) => s.show);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const successParams = new URLSearchParams({
    orderId: order.id,
    email,
  });
  if (order.trackingToken) {
    successParams.set("trackingToken", order.trackingToken);
  }
  const successUrl = `/checkout/success?${successParams.toString()}`;

  const resumeAndPay = useCallback(async () => {
    setIsProcessing(true);
    setError(null);

    try {
      const session = await resumePayment(order.id, {
        email,
        trackingToken: order.trackingToken,
      });

      if (session.demoMode) {
        const demo = await completeDemoPayment(order.id, email, order.trackingToken);
        if (demo.order) {
          cacheOrderForConfirmation(demo.order);
        }
        router.replace(demo.redirectUrl);
        return;
      }

      if (!session.razorpay) {
        throw new Error("Payment gateway unavailable.");
      }

      const shipping = session.shipping ?? {
        name: order.shippingAddress.name,
        email: order.email,
        phone: order.customerPhone ?? order.shippingAddress.phone,
      };

      const result = await openCheckout({
        key: session.razorpay.keyId,
        amount: session.razorpay.amount,
        currency: session.razorpay.currency,
        name: BRAND.name,
        description: `Order ${order.id}`,
        order_id: session.razorpay.orderId,
        prefill: {
          name: shipping.name,
          email: shipping.email,
          contact: shipping.phone,
        },
        notes: { orderId: order.id },
        theme: { color: "#1253ED" },
        handler: () => undefined,
      });

      if (result.status !== "success") {
        showToast(
          result.status === "failed"
            ? result.message
            : "Payment cancelled or failed. Please try again.",
          "error"
        );
        return;
      }

      const verified = await verifyPayment({
        orderId: order.id,
        razorpayOrderId: result.response.razorpay_order_id,
        razorpayPaymentId: result.response.razorpay_payment_id,
        razorpaySignature: result.response.razorpay_signature,
      });

      if (verified.order) {
        cacheOrderForConfirmation(verified.order);
      }

      router.replace(successUrl);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Payment failed.";
      setError(message);
      showToast(message, "error");
    } finally {
      setIsProcessing(false);
    }
  }, [email, openCheckout, order, router, showToast, successUrl]);

  const loading = isProcessing || isLoading;
  const disabled = loading || (!demoMode && !isReady);

  return (
    <div className="checkout-success">
      <div className="checkout-panel" style={{ maxWidth: "32rem", margin: "0 auto" }}>
        <p className="checkout-hero__eyebrow">Complete payment</p>
        <h1 className="checkout-panel__title">Order {order.id}</h1>
        <p className="checkout-panel__lead">
          {order.items.length} item{order.items.length === 1 ? "" : "s"} ·{" "}
          {order.email}
        </p>

        <p className="checkout-mobile-bar__total" style={{ marginTop: "1.5rem" }}>
          <span>Amount due</span>
          <strong>{formatCurrencyPrecise(order.total)}</strong>
        </p>

        {demoMode ? (
          <p className="checkout-panel__alert" role="note">
            Demo mode — payment will be simulated (no charge).
          </p>
        ) : null}

        {error ? (
          <p className="checkout-panel__alert" role="alert">
            {error}
          </p>
        ) : null}

        <div className="checkout-actions" style={{ marginTop: "1.5rem" }}>
          <button
            type="button"
            className="checkout-btn checkout-btn--primary"
            disabled={disabled}
            onClick={() => void resumeAndPay()}
          >
            {loading ? "Processing…" : "Pay now"}
          </button>
        </div>
      </div>
    </div>
  );
}
