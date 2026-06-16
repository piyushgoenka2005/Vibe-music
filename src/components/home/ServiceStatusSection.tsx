import Link from "next/link";
import {
  Clock3,
  CreditCard,
  MessageCircle,
  Package,
  type LucideIcon,
} from "lucide-react";
import { LANDING_SERVICE_STATUS } from "@/data/landingStatus";
import StatusChip from "@/components/home/StatusChip";
import Reveal from "@/components/layout/Reveal";

const ICONS: Record<(typeof LANDING_SERVICE_STATUS)[number]["icon"], LucideIcon> = {
  package: Package,
  "credit-card": CreditCard,
  clock: Clock3,
  message: MessageCircle,
};

export default function ServiceStatusSection() {
  return (
    <Reveal as="section" className="service-status" aria-labelledby="service-status-title">
      <div className="service-status__inner">
        <header className="service-status__header">
          <p className="service-status__eyebrow premium-section-eyebrow">Service status</p>
          <h2 id="service-status-title" className="service-status__title">
            Everything you need, clearly in view
          </h2>
          <p className="service-status__subtitle">
            Orders, payments, dispatch, and support — transparent at every step.
          </p>
        </header>

        <div className="service-status__grid">
          {LANDING_SERVICE_STATUS.map((item, index) => {
            const Icon = ICONS[item.icon];
            return (
              <Reveal
                key={item.title}
                className="service-status__card"
                delay={index * 70}
                as="article"
              >
                <div className="service-status__card-top">
                  <span className="service-status__icon-wrap" aria-hidden>
                    <Icon size={20} className="service-status__icon" />
                  </span>
                  <StatusChip
                    label={item.status}
                    tone={item.tone}
                    showDot={item.tone === "live"}
                  />
                </div>
                <h3 className="service-status__card-title">{item.title}</h3>
                <p className="service-status__card-desc">{item.desc}</p>
                <Link href={item.href} className="service-status__cta">
                  {item.cta}
                  <span aria-hidden>→</span>
                </Link>
              </Reveal>
            );
          })}
        </div>
      </div>
    </Reveal>
  );
}
