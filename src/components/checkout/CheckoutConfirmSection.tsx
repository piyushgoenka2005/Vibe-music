"use client";

import {
  CheckCircle2,
  CreditCard,
  Landmark,
  Mail,
  MapPin,
  Package,
  Smartphone,
} from "lucide-react";
import type { OnlinePaymentChannel } from "@/components/checkout/CheckoutPaymentMethods";
import StorefrontThumbImage from "@/components/common/StorefrontThumbImage";
import { formatCurrencyPrecise } from "@/utils/currency";
import type { ShippingAddress } from "@/types/order";

export interface ConfirmLineItem {
  lineId: string;
  name: string;
  quantity: number;
  price: number;
  image?: string;
  imageColor?: string;
}

interface CheckoutConfirmSectionProps {
  items: ConfirmLineItem[];
  address: ShippingAddress;
  email: string;
  phone: string;
  onlineChannel: OnlinePaymentChannel;
  onEditAddress: () => void;
  onEditPayment: () => void;
}

const CHANNEL_LABELS: Record<OnlinePaymentChannel, string> = {
  card: "Debit / Credit card",
  upi: "UPI",
  netbanking: "Net banking",
};

export default function CheckoutConfirmSection({
  items,
  address,
  email,
  phone,
  onlineChannel,
  onEditAddress,
  onEditPayment,
}: CheckoutConfirmSectionProps) {
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="checkout-confirm">
      <header className="checkout-confirm__hero">
        <div className="checkout-confirm__hero-icon" aria-hidden>
          <CheckCircle2 size={22} strokeWidth={2} />
        </div>
        <div>
          <h2 className="checkout-confirm__title">Confirm your order</h2>
          <p className="checkout-confirm__lead">
            Review your details, then swipe to pay securely in the order summary.
          </p>
        </div>
      </header>

      <section className="checkout-confirm__card checkout-confirm__card--items">
        <div className="checkout-confirm__card-head">
          <h3 className="checkout-confirm__card-label">
            <Package size={16} aria-hidden />
            <span>Order items</span>
          </h3>
          <span className="checkout-confirm__pill">
            {itemCount} {itemCount === 1 ? "item" : "items"}
          </span>
        </div>
        <ul className="checkout-confirm__items">
          {items.map((item) => (
            <li key={item.lineId} className="checkout-confirm__item">
              {item.image ? (
                <StorefrontThumbImage
                  src={item.image}
                  className="checkout-confirm__thumb"
                  width={56}
                  height={56}
                />
              ) : (
                <div
                  className="checkout-confirm__thumb"
                  style={{ background: item.imageColor ?? "#eef2f7" }}
                />
              )}
              <div className="checkout-confirm__item-body">
                <p className="checkout-confirm__item-name">{item.name}</p>
                <p className="checkout-confirm__item-meta">Qty {item.quantity}</p>
              </div>
              <p className="checkout-confirm__item-price">
                {formatCurrencyPrecise(item.price * item.quantity)}
              </p>
            </li>
          ))}
        </ul>
      </section>

      <div className="checkout-confirm__grid">
        <section className="checkout-confirm__card checkout-confirm__card--delivery">
          <div className="checkout-confirm__card-head">
            <h3 className="checkout-confirm__card-label">
              <MapPin size={16} aria-hidden />
              <span>Delivery</span>
            </h3>
            <button
              type="button"
              className="checkout-confirm__edit"
              onClick={onEditAddress}
              aria-label="Edit delivery address"
            >
              Edit
            </button>
          </div>
          <div className="checkout-confirm__detail">
            <p className="checkout-confirm__detail-name">{address.name}</p>
            <p className="checkout-confirm__detail-text">
              {address.line1}
              {address.line2 ? `, ${address.line2}` : ""}
              <br />
              {address.city}, {address.state} {address.postalCode}
              <br />
              {address.country}
            </p>
          </div>
          <div className="checkout-confirm__divider" />
          <div className="checkout-confirm__card-head checkout-confirm__card-head--sub">
            <h3 className="checkout-confirm__card-label">
              <Mail size={16} aria-hidden />
              <span>Contact</span>
            </h3>
          </div>
          <div className="checkout-confirm__detail">
            <p className="checkout-confirm__detail-text">{email}</p>
            {phone ? (
              <p className="checkout-confirm__detail-text">{phone}</p>
            ) : null}
          </div>
        </section>

        <section className="checkout-confirm__card checkout-confirm__card--accent">
          <div className="checkout-confirm__card-head">
            <h3 className="checkout-confirm__card-label">
              <CreditCard size={16} aria-hidden />
              <span>Payment</span>
            </h3>
            <button
              type="button"
              className="checkout-confirm__edit"
              onClick={onEditPayment}
              aria-label="Edit payment method"
            >
              Edit
            </button>
          </div>
          <div className="checkout-confirm__payment">
            <span className="checkout-confirm__payment-icon" aria-hidden>
              {onlineChannel === "upi" ? (
                <Smartphone size={20} />
              ) : onlineChannel === "netbanking" ? (
                <Landmark size={20} />
              ) : (
                <CreditCard size={20} />
              )}
            </span>
            <div>
              <p className="checkout-confirm__payment-title">Pay Online</p>
              <p className="checkout-confirm__payment-sub">
                {`${CHANNEL_LABELS[onlineChannel]} via Razorpay`}
              </p>
            </div>
          </div>
          <p className="checkout-confirm__secure">
            256-bit SSL · PCI-DSS compliant · Powered by Razorpay
          </p>
        </section>
      </div>

      <p className="checkout-confirm__footnote">
        By confirming, you agree to place this order. An invoice will be
        emailed after payment.
      </p>
    </div>
  );
}
