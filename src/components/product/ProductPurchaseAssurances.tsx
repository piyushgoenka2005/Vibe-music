"use client";

import {
  Award,
  CreditCard,
  RotateCcw,
  ShieldCheck,
  Truck,
  type LucideIcon,
} from "lucide-react";

interface AssuranceItem {
  icon: LucideIcon;
  label: string;
  detail: string;
}

const ASSURANCES: AssuranceItem[] = [
  {
    icon: Truck,
    label: "Free Shipping",
    detail: "Free delivery on orders over ₹9,999",
  },
  {
    icon: CreditCard,
    label: "Secure Online Pay",
    detail: "Pay securely online — UPI, cards & wallets",
  },
  {
    icon: RotateCcw,
    label: "Easy Returns",
    detail: "7-day easy returns on eligible gear",
  },
  {
    icon: ShieldCheck,
    label: "Manufacturer Warranty",
    detail: "Official warranty on all new products",
  },
  {
    icon: Award,
    label: "Authorized Dealer",
    detail: "100% genuine gear from authorized brands",
  },
];

export default function ProductPurchaseAssurances() {
  return (
    <aside className="pdp-assurances" aria-label="Purchase assurances">
      <div className="pdp-assurances__card">
        <ul className="pdp-assurances__list">
          {ASSURANCES.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.label} className="pdp-assurances__item">
                <span className="pdp-assurances__icon" aria-hidden="true">
                  <Icon size={16} strokeWidth={2} />
                </span>
                <span className="pdp-assurances__copy">
                  <span className="pdp-assurances__label">{item.label}</span>
                  <span className="pdp-assurances__detail">{item.detail}</span>
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </aside>
  );
}
