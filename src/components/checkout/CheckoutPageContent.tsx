"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createOrder, updateOrderStatus } from "@/services/order.service";
import { useAuthStore } from "@/store/authStore";
import { useCartStore } from "@/store/cartStore";
import { ROUTES } from "@/lib/routes";
import {
  checkoutSchema,
  type CheckoutFormValues,
} from "@/lib/validations/checkout";
import "./checkout.css";

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void };
  }
}

function formatPrice(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
}

function loadRazorpayScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.Razorpay) {
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Razorpay failed to load"));
    document.body.appendChild(script);
  });
}

export default function CheckoutPageContent() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const items = useCartStore((s) => s.items);
  const subtotal = useCartStore((s) => s.subtotal());
  const discount = useCartStore((s) => s.discount());
  const total = useCartStore((s) => s.total());
  const couponCode = useCartStore((s) => s.couponCode);
  const clearCart = useCartStore((s) => s.clearCart);

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      fullName: user?.name ?? "",
      email: user?.email ?? "",
      phone: "",
      line1: "",
      line2: "",
      city: "",
      state: "",
      postalCode: "",
      country: "IN",
    },
  });

  const canCheckout = items.length > 0;

  const summary = useMemo(
    () => ({
      subtotal,
      discount,
      total,
      itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
    }),
    [discount, items, subtotal, total]
  );

  async function onSubmit(values: CheckoutFormValues) {
    if (!canCheckout) return;
    setSubmitting(true);
    setError(null);

    try {
      const order = await createOrder({
        userId: user?.id ?? null,
        email: values.email,
        items,
        shipping: values,
        subtotal,
        discount,
        total,
        couponCode,
      });

      const paymentResponse = await fetch("/api/payments/razorpay/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: order.id,
          amount: Math.round(total * 100),
          currency: "INR",
          email: values.email,
          name: values.fullName,
        }),
      });

      const paymentData = (await paymentResponse.json()) as {
        demo?: boolean;
        key?: string;
        orderId?: string;
        razorpayOrderId?: string;
        amount?: number;
        currency?: string;
        error?: string;
      };

      if (!paymentResponse.ok) {
        throw new Error(paymentData.error ?? "Payment initialization failed");
      }

      if (paymentData.demo) {
        await updateOrderStatus(order.id, "paid", "demo-payment");
        clearCart();
        router.push(`${ROUTES.checkout}?success=${order.id}`);
        return;
      }

      await loadRazorpayScript();
      if (!window.Razorpay || !paymentData.key || !paymentData.razorpayOrderId) {
        throw new Error("Payment gateway unavailable");
      }

      const rzp = new window.Razorpay({
        key: paymentData.key,
        amount: paymentData.amount,
        currency: paymentData.currency,
        name: "VibeMusic",
        description: `Order ${order.id}`,
        order_id: paymentData.razorpayOrderId,
        prefill: {
          name: values.fullName,
          email: values.email,
          contact: values.phone,
        },
        handler: async (response: {
          razorpay_payment_id: string;
          razorpay_order_id: string;
          razorpay_signature: string;
        }) => {
          const verify = await fetch("/api/payments/razorpay/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              orderId: order.id,
              ...response,
            }),
          });
          if (!verify.ok) {
            setError("Payment verification failed");
            return;
          }
          clearCart();
          router.push(`${ROUTES.checkout}?success=${order.id}`);
        },
        modal: {
          ondismiss: () => setSubmitting(false),
        },
      });
      rzp.open();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Checkout failed");
    } finally {
      setSubmitting(false);
    }
  }

  if (!canCheckout && !submitting) {
    return (
      <section className="checkout-page">
        <h1>Checkout</h1>
        <p>Your cart is empty.</p>
        <Link href={ROUTES.cart} className="sw-btn sw-btn-blue">
          View cart
        </Link>
      </section>
    );
  }

  return (
    <section className="checkout-page">
      <h1>Checkout</h1>
      <div className="checkout-steps" aria-label="Checkout progress">
        <span className={step >= 1 ? "active" : ""}>1. Review</span>
        <span className={step >= 2 ? "active" : ""}>2. Shipping</span>
        <span className={step >= 3 ? "active" : ""}>3. Payment</span>
      </div>

      <div className="checkout-layout">
        <div className="checkout-main">
          {step === 1 && (
            <div className="checkout-panel">
              <h2>Cart review</h2>
              <ul className="checkout-items">
                {items.map((item) => (
                  <li key={item.productId}>
                    <div>
                      <strong>{item.name}</strong>
                      <div>{item.brand}</div>
                    </div>
                    <div>
                      {item.quantity} × {formatPrice(item.price)}
                    </div>
                  </li>
                ))}
              </ul>
              <Button type="button" onClick={() => setStep(2)}>
                Continue to shipping
              </Button>
            </div>
          )}

          {step === 2 && (
            <form
              className="checkout-panel"
              onSubmit={form.handleSubmit(() => setStep(3))}
            >
              <h2>Shipping address</h2>
              <div className="checkout-grid">
                <div>
                  <Label htmlFor="fullName">Full name</Label>
                  <Input id="fullName" {...form.register("fullName")} />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" {...form.register("email")} />
                </div>
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input id="phone" {...form.register("phone")} />
                </div>
                <div className="full">
                  <Label htmlFor="line1">Address line 1</Label>
                  <Input id="line1" {...form.register("line1")} />
                </div>
                <div className="full">
                  <Label htmlFor="line2">Address line 2</Label>
                  <Input id="line2" {...form.register("line2")} />
                </div>
                <div>
                  <Label htmlFor="city">City</Label>
                  <Input id="city" {...form.register("city")} />
                </div>
                <div>
                  <Label htmlFor="state">State</Label>
                  <Input id="state" {...form.register("state")} />
                </div>
                <div>
                  <Label htmlFor="postalCode">Postal code</Label>
                  <Input id="postalCode" {...form.register("postalCode")} />
                </div>
                <div>
                  <Label htmlFor="country">Country</Label>
                  <Input id="country" {...form.register("country")} />
                </div>
              </div>
              <div className="checkout-actions">
                <Button type="button" variant="outline" onClick={() => setStep(1)}>
                  Back
                </Button>
                <Button type="submit">Continue to payment</Button>
              </div>
            </form>
          )}

          {step === 3 && (
            <form
              className="checkout-panel"
              onSubmit={form.handleSubmit(onSubmit)}
            >
              <h2>Payment</h2>
              <p>Total due: {formatPrice(summary.total)}</p>
              <p className="checkout-note">
                Payments are processed securely via Razorpay. Card details are never stored on our
                servers.
              </p>
              {error ? (
                <p className="checkout-error" role="alert">
                  {error}
                </p>
              ) : null}
              <div className="checkout-actions">
                <Button type="button" variant="outline" onClick={() => setStep(2)}>
                  Back
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? "Processing..." : "Pay now"}
                </Button>
              </div>
            </form>
          )}
        </div>

        <aside className="checkout-summary" aria-label="Order summary">
          <h2>Order summary</h2>
          <dl>
            <div>
              <dt>Items</dt>
              <dd>{summary.itemCount}</dd>
            </div>
            <div>
              <dt>Subtotal</dt>
              <dd>{formatPrice(summary.subtotal)}</dd>
            </div>
            {summary.discount > 0 ? (
              <div>
                <dt>Discount</dt>
                <dd>-{formatPrice(summary.discount)}</dd>
              </div>
            ) : null}
            <div>
              <dt>Total</dt>
              <dd>{formatPrice(summary.total)}</dd>
            </div>
          </dl>
        </aside>
      </div>
    </section>
  );
}
