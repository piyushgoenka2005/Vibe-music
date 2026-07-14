"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ROUTES } from "@/lib/routes";
import type { RentalDurationType, RentalProduct } from "@/types/rental";
import { formatCurrency } from "@/utils/currency";
import { useAuthStore } from "@/store/authStore";
import { useRazorpay } from "@/hooks/useRazorpay";

export default function RentalCheckoutPageClient() {
  const router = useRouter();
  const params = useSearchParams();
  const user = useAuthStore((s) => s.user);
  const { openCheckout } = useRazorpay();

  const productSlug = params.get("product") ?? "";
  const durationType = (params.get("durationType") ?? "daily") as RentalDurationType;
  const startAt = params.get("startAt") ?? "";
  const endAt = params.get("endAt") ?? "";
  const fulfillment = (params.get("fulfillment") ?? "pickup") as "pickup" | "delivery";

  const [email, setEmail] = useState(user?.email ?? "");
  const [customerName, setCustomerName] = useState(user?.name ?? user?.email?.split("@")[0] ?? "");
  const [customerPhone, setCustomerPhone] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"razorpay" | "cod">("razorpay");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [agreementAccepted, setAgreementAccepted] = useState(false);
  const [address, setAddress] = useState({
    name: "",
    phone: "",
    line1: "",
    city: "",
    state: "Maharashtra",
    postalCode: "",
  });

  const { data: productData } = useQuery({
    queryKey: ["rental-checkout-product", productSlug],
    enabled: Boolean(productSlug),
    queryFn: async () => {
      const res = await fetch(`/api/rentals/products/${productSlug}`);
      if (!res.ok) throw new Error("Product not found");
      return res.json() as Promise<{ product: RentalProduct }>;
    },
  });

  const { data: policyData } = useQuery({
    queryKey: ["rental-policy"],
    queryFn: async () => {
      const res = await fetch("/api/rentals/policy");
      return res.json() as Promise<{ policy: { cancellationPolicy: string } }>;
    },
  });

  const quoteQuery = useQuery({
    queryKey: ["rental-checkout-quote", productSlug, durationType, startAt, endAt, fulfillment],
    enabled: Boolean(productData?.product && startAt && endAt),
    queryFn: async () => {
      const res = await fetch("/api/rentals/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: productData!.product.id,
          durationType,
          startAt,
          endAt,
          fulfillment,
          quantity: 1,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Quote failed");
      return json.quote as { total: number; depositAmount: number; available: boolean };
    },
  });

  const bookMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/rentals/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: [
            {
              productId: productData!.product.id,
              durationType,
              startAt,
              endAt,
              fulfillment,
              quantity: 1,
            },
          ],
          email,
          customerName,
          customerPhone,
          fulfillment,
          paymentMethod,
          termsAccepted: true,
          agreementAccepted: true,
          address:
            fulfillment === "delivery"
              ? {
                  name: address.name || customerName,
                  phone: address.phone || customerPhone,
                  line1: address.line1,
                  city: address.city,
                  state: address.state,
                  postalCode: address.postalCode,
                }
              : undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Booking failed");
      return json as {
        booking: { id: string; bookingNumber: string; trackingToken?: string | null };
        razorpayOrderId?: string;
        demoPaymentAllowed?: boolean;
      };
    },
    onSuccess: async (result) => {
      const tokenQuery = result.booking.trackingToken
        ? `&token=${encodeURIComponent(result.booking.trackingToken)}`
        : "";
      if (result.demoPaymentAllowed || paymentMethod === "cod") {
        router.push(`/rentals/success?booking=${result.booking.id}${tokenQuery}`);
        return;
      }
      if (result.razorpayOrderId) {
        const key = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ?? "";
        const checkoutResult = await openCheckout({
          key,
          amount: Math.round((quoteQuery.data?.total ?? 0) * 100),
          currency: "INR",
          name: "Vibe Music Rentals",
          description: result.booking.bookingNumber,
          order_id: result.razorpayOrderId,
          prefill: { name: customerName, email, contact: customerPhone },
          handler: async (response) => {
            await fetch("/api/rentals/bookings/verify-payment", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                bookingId: result.booking.id,
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
              }),
            });
            router.push(`/rentals/success?booking=${result.booking.id}${tokenQuery}`);
          },
        });
        if (checkoutResult.status === "success") return;
        if (checkoutResult.status === "failed") {
          throw new Error(checkoutResult.message);
        }
        return;
      }
      router.push(`/rentals/success?booking=${result.booking.id}${tokenQuery}`);
    },
  });

  const product = productData?.product;
  const quote = quoteQuery.data;
  const canSubmit =
    product &&
    quote?.available &&
    email &&
    customerName &&
    customerPhone &&
    termsAccepted &&
    agreementAccepted &&
    (fulfillment === "pickup" || address.line1);

  const cancellationPolicy = useMemo(
    () => policyData?.policy.cancellationPolicy ?? "",
    [policyData]
  );

  if (!productSlug) {
    return (
      <main className="storefront-page rentals-page">
        <p className="rentals-empty">
          No rental item selected. <Link href={ROUTES.rentals}>Browse rentals</Link>
        </p>
      </main>
    );
  }

  return (
    <main className="storefront-page rentals-page">
      <h1 className="rentals-hero__title">Rental checkout</h1>
      {product ? <p className="rentals-hero__subtitle">{product.name}</p> : null}

      <div className="rentals-form" style={{ maxWidth: 520, marginTop: "1.5rem" }}>
        <label>
          Full name
          <input value={customerName} onChange={(e) => setCustomerName(e.target.value)} required />
        </label>
        <label>
          Email
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>
        <label>
          Phone
          <input value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} required />
        </label>
        <label>
          Payment
          <select
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value as "razorpay" | "cod")}
          >
            <option value="razorpay">Pay online (Razorpay)</option>
          </select>
        </label>

        {fulfillment === "delivery" ? (
          <>
            <label>
              Address line
              <input value={address.line1} onChange={(e) => setAddress({ ...address, line1: e.target.value })} />
            </label>
            <label>
              City
              <input value={address.city} onChange={(e) => setAddress({ ...address, city: e.target.value })} />
            </label>
            <label>
              Postal code
              <input
                value={address.postalCode}
                onChange={(e) => setAddress({ ...address, postalCode: e.target.value })}
              />
            </label>
          </>
        ) : null}

        <label>
          <input
            type="checkbox"
            checked={termsAccepted}
            onChange={(e) => setTermsAccepted(e.target.checked)}
          />{" "}
          I accept the rental terms
        </label>
        <label>
          <input
            type="checkbox"
            checked={agreementAccepted}
            onChange={(e) => setAgreementAccepted(e.target.checked)}
          />{" "}
          I accept the rental agreement and deposit policy
        </label>

        {cancellationPolicy ? (
          <p className="rentals-product-card__meta">{cancellationPolicy}</p>
        ) : null}

        {quote ? (
          <div className="rentals-quote">
            <p>Total due now: <strong>{formatCurrency(quote.total)}</strong></p>
            <p className="rentals-product-card__meta">
              Includes refundable deposit {formatCurrency(quote.depositAmount)}
            </p>
          </div>
        ) : null}

        <button
          type="button"
          className="rentals-btn"
          disabled={!canSubmit || bookMutation.isPending}
          onClick={() => bookMutation.mutate()}
        >
          {bookMutation.isPending ? "Processing…" : "Confirm rental booking"}
        </button>

        {bookMutation.error ? (
          <p role="alert">{bookMutation.error.message}</p>
        ) : null}
      </div>
    </main>
  );
}
