"use client";

import { Check, CreditCard, Landmark, Lock, Smartphone } from "lucide-react";
import {
  GlassEffect,
  GlassEffectButton,
} from "@/components/ui/liquid-glass";
import type { PaymentMethod } from "@/types/order";

export type OnlinePaymentChannel = "card" | "upi" | "netbanking";

interface CheckoutPaymentMethodsProps {
  paymentMethod: PaymentMethod;
  onlineChannel: OnlinePaymentChannel;
  onPaymentMethodChange: (method: PaymentMethod) => void;
  onOnlineChannelChange: (channel: OnlinePaymentChannel) => void;
  /** When false, online/Razorpay cannot be selected. */
  onlinePaymentsAvailable?: boolean;
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

interface PaymentGlassCardProps {
  selected: boolean;
  wide?: boolean;
  channel?: boolean;
  disabled?: boolean;
  onClick: () => void;
  icon: typeof CreditCard;
  iconSize?: number;
  title: string;
  subtitle: string;
  tags?: string[];
}

function PaymentGlassCard({
  selected,
  wide = false,
  channel = false,
  disabled = false,
  onClick,
  icon: Icon,
  iconSize = 22,
  title,
  subtitle,
  tags,
}: PaymentGlassCardProps) {
  return (
    <GlassEffectButton
      aria-disabled={disabled}
      aria-pressed={selected}
      className={[
        "checkout-pay-card",
        wide ? "checkout-pay-card--wide" : "",
        channel ? "checkout-pay-card--channel" : "",
        selected ? "checkout-pay-card--selected" : "",
        disabled ? "checkout-pay-card--disabled" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      disabled={disabled}
      onClick={onClick}
      selected={selected}
      tone="light"
    >
      {selected ? (
        <span className="checkout-pay-card__check" aria-hidden>
          <Check size={channel ? 12 : 14} strokeWidth={3} />
        </span>
      ) : null}
      <span
        className={`checkout-pay-card__icon${
          channel ? " checkout-pay-card__icon--sm" : ""
        }`}
        aria-hidden
      >
        <Icon size={iconSize} />
      </span>
      <span className="checkout-pay-card__body">
        <strong>{title}</strong>
        <span>{subtitle}</span>
      </span>
      {tags?.length ? (
        <span className="checkout-pay-card__tags">
          {tags.map((tag) => (
            <span key={tag}>{tag}</span>
          ))}
        </span>
      ) : null}
    </GlassEffectButton>
  );
}

export default function CheckoutPaymentMethods({
  paymentMethod,
  onlineChannel,
  onPaymentMethodChange,
  onOnlineChannelChange,
  onlinePaymentsAvailable = true,
}: CheckoutPaymentMethodsProps) {
  return (
    <div className="checkout-pay-stage">
      <div className="checkout-pay-stage__bg" aria-hidden />
      <span className="checkout-pay-stage__orb checkout-pay-stage__orb--a" aria-hidden />
      <span className="checkout-pay-stage__orb checkout-pay-stage__orb--b" aria-hidden />
      <GlassEffect
        className="checkout-pay-stage__shell rounded-[1.375rem]"
        interactive={false}
        tone="light"
      >
        <div className="checkout-pay-methods">
          <div className="checkout-pay-methods__primary">
            <PaymentGlassCard
              disabled={!onlinePaymentsAvailable}
              icon={CreditCard}
              onClick={() => {
                if (!onlinePaymentsAvailable) return;
                onPaymentMethodChange("razorpay");
              }}
              selected={paymentMethod === "razorpay"}
              subtitle={
                onlinePaymentsAvailable
                  ? "UPI, cards, net banking via Razorpay"
                  : "Online payments are not configured — contact support"
              }
              title="Pay Online"
              wide
            />
          </div>

          {paymentMethod === "razorpay" && onlinePaymentsAvailable ? (
            <div className="checkout-pay-methods__channels">
              {ONLINE_CHANNELS.map((channel) => (
                <PaymentGlassCard
                  key={channel.id}
                  channel
                  icon={channel.icon}
                  iconSize={18}
                  onClick={() => onOnlineChannelChange(channel.id)}
                  selected={onlineChannel === channel.id}
                  subtitle={channel.subtitle}
                  tags={channel.tags}
                  title={channel.title}
                />
              ))}
            </div>
          ) : null}

          <div className="checkout-pay-methods__trust">
            <span>
              <Lock size={12} strokeWidth={2} aria-hidden />
              256-bit SSL · PCI-DSS compliant
            </span>
            <span>
              {onlinePaymentsAvailable
                ? "Powered by Razorpay"
                : "Contact support to complete payment"}
            </span>
          </div>
        </div>
      </GlassEffect>
    </div>
  );
}
