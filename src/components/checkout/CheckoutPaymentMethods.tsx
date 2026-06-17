"use client";

import { Banknote, Check, CreditCard, Landmark, Smartphone } from "lucide-react";
import type { PaymentMethod } from "@/types/order";

export type OnlinePaymentChannel = "card" | "upi" | "netbanking";

interface CheckoutPaymentMethodsProps {
  paymentMethod: PaymentMethod;
  onlineChannel: OnlinePaymentChannel;
  onPaymentMethodChange: (method: PaymentMethod) => void;
  onOnlineChannelChange: (channel: OnlinePaymentChannel) => void;
}

const ONLINE_CHANNELS: Array<{
  id: OnlinePaymentChannel;
  title: string;
  subtitle: string;
  tags: string[];
  icon: typeof CreditCard;
}> = [
  {
    id: "card",
    title: "Debit / Credit",
    subtitle: "Visa · Mastercard · RuPay",
    tags: ["VISA", "MC", "RuPay"],
    icon: CreditCard,
  },
  {
    id: "upi",
    title: "UPI",
    subtitle: "Instant bank transfer",
    tags: ["GPay", "PhonePe", "Paytm"],
    icon: Smartphone,
  },
  {
    id: "netbanking",
    title: "Net Banking",
    subtitle: "All major banks",
    tags: ["HDFC", "SBI", "ICICI", "Axis"],
    icon: Landmark,
  },
];

export default function CheckoutPaymentMethods({
  paymentMethod,
  onlineChannel,
  onPaymentMethodChange,
  onOnlineChannelChange,
}: CheckoutPaymentMethodsProps) {
  return (
    <div className="checkout-pay-methods">
      <div className="checkout-pay-methods__primary">
        <button
          type="button"
          className={`checkout-pay-card checkout-pay-card--wide${
            paymentMethod === "razorpay" ? " checkout-pay-card--selected" : ""
          }`}
          onClick={() => onPaymentMethodChange("razorpay")}
        >
          {paymentMethod === "razorpay" ? (
            <span className="checkout-pay-card__check" aria-hidden>
              <Check size={14} strokeWidth={3} />
            </span>
          ) : null}
          <span className="checkout-pay-card__icon" aria-hidden>
            <CreditCard size={22} />
          </span>
          <span className="checkout-pay-card__body">
            <strong>Pay Online</strong>
            <span>UPI, cards, net banking via Razorpay</span>
          </span>
        </button>

        <button
          type="button"
          className={`checkout-pay-card checkout-pay-card--wide${
            paymentMethod === "cod" ? " checkout-pay-card--selected" : ""
          }`}
          onClick={() => onPaymentMethodChange("cod")}
        >
          {paymentMethod === "cod" ? (
            <span className="checkout-pay-card__check" aria-hidden>
              <Check size={14} strokeWidth={3} />
            </span>
          ) : null}
          <span className="checkout-pay-card__icon" aria-hidden>
            <Banknote size={22} />
          </span>
          <span className="checkout-pay-card__body">
            <strong>Cash on Delivery</strong>
            <span>Pay in cash when your order arrives</span>
          </span>
        </button>
      </div>

      {paymentMethod === "razorpay" ? (
        <div className="checkout-pay-methods__channels">
          {ONLINE_CHANNELS.map((channel) => {
            const Icon = channel.icon;
            const selected = onlineChannel === channel.id;
            return (
              <button
                key={channel.id}
                type="button"
                className={`checkout-pay-card checkout-pay-card--channel${
                  selected ? " checkout-pay-card--selected" : ""
                }`}
                onClick={() => onOnlineChannelChange(channel.id)}
              >
                {selected ? (
                  <span className="checkout-pay-card__check" aria-hidden>
                    <Check size={12} strokeWidth={3} />
                  </span>
                ) : null}
                <span className="checkout-pay-card__icon checkout-pay-card__icon--sm" aria-hidden>
                  <Icon size={18} />
                </span>
                <span className="checkout-pay-card__body">
                  <strong>{channel.title}</strong>
                  <span>{channel.subtitle}</span>
                </span>
                <span className="checkout-pay-card__tags">
                  {channel.tags.map((tag) => (
                    <span key={tag}>{tag}</span>
                  ))}
                </span>
              </button>
            );
          })}
        </div>
      ) : null}

      <div className="checkout-pay-methods__trust">
        <span>
          <LockIcon /> 256-bit SSL · PCI-DSS compliant
        </span>
        <span>Powered by Razorpay</span>
      </div>
    </div>
  );
}

function LockIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M7 11V8a5 5 0 0 1 10 0v3"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <rect
        x="5"
        y="11"
        width="14"
        height="10"
        rx="2"
        stroke="currentColor"
        strokeWidth="2"
      />
    </svg>
  );
}
