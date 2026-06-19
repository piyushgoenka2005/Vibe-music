"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { BRAND } from "@/lib/brand";
import { cacheOrderForConfirmation } from "@/lib/checkout/orderConfirmationCache";
import { useRazorpay } from "@/hooks/useRazorpay";
import {
  createCodOrder,
  createPaymentOrder,
  completeDemoPayment,
  releaseOrderReservation,
  verifyPayment,
} from "@/services/orderService";
import { useCartStore } from "@/store/cartStore";
import { useToastStore } from "@/store/toastStore";
import type { CreateOrderPayload, PaymentMethod, ShippingAddress } from "@/types/order";
import type { CheckoutSummaryItem } from "@/components/checkout/CheckoutSummary";

export interface UseCheckoutPaymentOptions {
  items: CheckoutSummaryItem[];
  shippingAddress: ShippingAddress;
  buyerState: string;
  email: string;
  customerName?: string;
  customerPhone?: string;
  phone?: string;
  paymentMethod: PaymentMethod;
  disabled?: boolean;
}

export function useCheckoutPayment({
  items,
  shippingAddress,
  buyerState,
  email,
  customerName,
  customerPhone,
  phone,
  paymentMethod,
  disabled = false,
}: UseCheckoutPaymentOptions) {
  const router = useRouter();
  const { isReady, isLoading, error, openCheckout } = useRazorpay();
  const [isProcessing, setIsProcessing] = useState(false);

  const couponCode = useCartStore((s) => s.couponCode);
  const couponDiscount = useCartStore((s) => s.discount());
  const clearCart = useCartStore((s) => s.clearCart);
  const showToast = useToastStore((s) => s.show);

  const isDisabled = disabled || isProcessing || isLoading;

  async function buildPayload(): Promise<CreateOrderPayload> {
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
      buyerState,
    };
  }

  function successUrl(orderId: string): string {
    const params = new URLSearchParams({ orderId, email });
    return `/checkout/success?${params.toString()}`;
  }

  const pay = useCallback(async () => {
    if (disabled || isProcessing || isLoading) return;

    setIsProcessing(true);
    let pendingOrderId: string | null = null;

    try {
      const payload = await buildPayload();

      if (paymentMethod === "cod") {
        const { orderId, order } = await createCodOrder(payload);
        cacheOrderForConfirmation(order);
        clearCart();
        router.replace(successUrl(orderId));
        return;
      }

      const orderResponse = await createPaymentOrder(payload);
      pendingOrderId = orderResponse.orderId;

      if (orderResponse.demoMode) {
        const demo = await completeDemoPayment(orderResponse.orderId, email);
        if (demo.order) {
          cacheOrderForConfirmation(demo.order);
        }
        clearCart();
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

      clearCart();
      router.replace(successUrl(orderResponse.orderId));
    } catch (err) {
      if (pendingOrderId) {
        await releaseOrderReservation(pendingOrderId, email).catch(
          () => undefined
        );
      }
      showToast(err instanceof Error ? err.message : "Payment failed", "error");
    } finally {
      setIsProcessing(false);
    }
  }, [
    disabled,
    isProcessing,
    isLoading,
    paymentMethod,
    items,
    email,
    phone,
    shippingAddress,
    buyerState,
    customerName,
    customerPhone,
    couponCode,
    couponDiscount,
    clearCart,
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
  };
}
