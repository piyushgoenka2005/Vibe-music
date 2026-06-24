"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { BRAND } from "@/lib/brand";
import { cacheOrderForConfirmation } from "@/lib/checkout/orderConfirmationCache";
import { ensureRazorpayScriptLoaded, useRazorpay } from "@/hooks/useRazorpay";
import {
  createCodOrder,
  createPaymentOrder,
  completeDemoPayment,
  releaseOrderReservation,
  verifyPayment,
} from "@/services/orderService";
import { useCartStore } from "@/store/cartStore";
import { useToastStore } from "@/store/toastStore";
import type { ShippingMethod } from "@/lib/shipping/shippingMethods";
import type {
  CreateOrderPayload,
  CreateRazorpayOrderResponse,
  PaymentMethod,
  ShippingAddress,
} from "@/types/order";
import type { CheckoutSummaryItem } from "@/components/checkout/CheckoutSummary";

export interface UseCheckoutPaymentOptions {
  items: CheckoutSummaryItem[];
  shippingAddress: ShippingAddress;
  shippingMethod?: ShippingMethod;
  buyerState: string;
  email: string;
  customerName?: string;
  customerPhone?: string;
  phone?: string;
  paymentMethod: PaymentMethod;
  disabled?: boolean;
  /** Warm the create-order API while the user reviews payment options. */
  prefetchEnabled?: boolean;
}

function orderPayloadKey(payload: CreateOrderPayload): string {
  return JSON.stringify({
    items: payload.items,
    email: payload.email,
    shipping: payload.shippingAddress,
    coupon: payload.couponCode,
    discount: payload.couponDiscount,
    method: payload.paymentMethod,
    shippingMethod: payload.shippingMethod,
    buyerState: payload.buyerState,
  });
}

export function useCheckoutPayment({
  items,
  shippingAddress,
  shippingMethod = "standard",
  buyerState,
  email,
  customerName,
  customerPhone,
  phone,
  paymentMethod,
  disabled = false,
  prefetchEnabled = false,
}: UseCheckoutPaymentOptions) {
  const router = useRouter();
  const { isReady, isLoading, error, openCheckout } = useRazorpay();
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingLabel, setProcessingLabel] = useState<string | null>(null);
  const prefetchRef = useRef<{
    key: string;
    promise: Promise<CreateRazorpayOrderResponse>;
  } | null>(null);

  const couponCode = useCartStore((s) => s.couponCode);
  const couponDiscount = useCartStore((s) => s.discount());
  const showToast = useToastStore((s) => s.show);

  const isDisabled = disabled || isProcessing;

  const buildPayload = useCallback((): CreateOrderPayload => {
    return {
      items: items.map((item) => ({
        productId: item.productId,
        variantId: item.variantId,
        variantSku: item.variantSku,
        variantLabel: item.variantLabel,
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        gstRate: item.gstRate,
      })),
      email,
      customerName: customerName ?? shippingAddress.name,
      customerPhone: customerPhone ?? shippingAddress.phone,
      couponCode,
      couponDiscount,
      shippingAddress,
      paymentMethod,
      shippingMethod,
      buyerState,
    };
  }, [
    items,
    email,
    customerName,
    customerPhone,
    shippingAddress,
    couponCode,
    couponDiscount,
    paymentMethod,
    shippingMethod,
    buyerState,
  ]);

  useEffect(() => {
    if (!prefetchEnabled || paymentMethod !== "razorpay" || disabled) {
      prefetchRef.current = null;
      return;
    }

    const timer = window.setTimeout(() => {
      const payload = buildPayload();
      const key = orderPayloadKey(payload);

      if (prefetchRef.current?.key === key) {
        return;
      }

      void ensureRazorpayScriptLoaded().catch(() => undefined);

      prefetchRef.current = {
        key,
        promise: createPaymentOrder(payload),
      };
    }, 350);

    return () => window.clearTimeout(timer);
  }, [prefetchEnabled, paymentMethod, disabled, buildPayload]);

  function successUrl(orderId: string): string {
    const params = new URLSearchParams({ orderId, email });
    return `/checkout/success?${params.toString()}`;
  }

  function goToOrderConfirmation(orderId: string) {
    const url = successUrl(orderId);
    router.replace(url);
  }

  const pay = useCallback(async () => {
    if (disabled || isProcessing) return;

    setIsProcessing(true);
    setProcessingLabel(
      paymentMethod === "razorpay" ? "Creating order…" : "Placing order…"
    );
    let pendingOrderId: string | null = null;

    try {
      const payload = buildPayload();

      if (paymentMethod === "cod") {
        const { orderId, order } = await createCodOrder(payload);
        cacheOrderForConfirmation(order);
        goToOrderConfirmation(orderId);
        return;
      }

      const key = orderPayloadKey(payload);
      const prefetched =
        prefetchRef.current?.key === key ? prefetchRef.current.promise : null;
      prefetchRef.current = null;

      const [orderResponse] = await Promise.all([
        prefetched ?? createPaymentOrder(payload),
        ensureRazorpayScriptLoaded(),
      ]);

      pendingOrderId = orderResponse.orderId;
      setProcessingLabel("Opening Razorpay…");

      if (orderResponse.demoMode) {
        const demo = await completeDemoPayment(orderResponse.orderId, email);
        if (demo.order) {
          cacheOrderForConfirmation(demo.order);
        }
        router.replace(demo.redirectUrl);
        return;
      }

      if (!orderResponse.keyId?.startsWith("rzp_")) {
        throw new Error(
          "Online payments are not configured. Add Razorpay keys to .env.local and restart the dev server."
        );
      }

      if (
        !orderResponse.razorpayOrderId ||
        orderResponse.amount == null ||
        !orderResponse.currency
      ) {
        throw new Error("Unable to start Razorpay checkout.");
      }

      setIsProcessing(false);

      const result = await openCheckout({
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
        notes: { orderId: orderResponse.orderId },
        theme: { color: "#1253ED" },
        handler: () => undefined,
      });

      if (result.status !== "success") {
        await releaseOrderReservation(orderResponse.orderId, email).catch(
          () => undefined
        );
        showToast(
          result.status === "failed"
            ? result.message
            : "Payment cancelled or failed. Please try again.",
          "error"
        );
        return;
      }

      const verified = await verifyPayment({
        orderId: orderResponse.orderId,
        razorpayOrderId: result.response.razorpay_order_id,
        razorpayPaymentId: result.response.razorpay_payment_id,
        razorpaySignature: result.response.razorpay_signature,
      });

      if (verified.order) {
        cacheOrderForConfirmation(verified.order);
      }

      goToOrderConfirmation(orderResponse.orderId);
    } catch (err) {
      if (pendingOrderId) {
        await releaseOrderReservation(pendingOrderId, email).catch(
          () => undefined
        );
      }
      showToast(err instanceof Error ? err.message : "Payment failed", "error");
    } finally {
      setProcessingLabel(null);
      setIsProcessing(false);
    }
  }, [
    disabled,
    isProcessing,
    paymentMethod,
    buildPayload,
    email,
    phone,
    shippingAddress,
    showToast,
    router,
    openCheckout,
  ]);

  return {
    pay,
    isProcessing,
    isLoading,
    isDisabled,
    isReady,
    error,
    paymentMethod,
    processingLabel,
  };
}
