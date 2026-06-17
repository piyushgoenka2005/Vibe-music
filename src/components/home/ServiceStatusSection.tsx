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
import RevealGroup from "@/components/layout/RevealGroup";

const ICONS: Record<(typeof LANDING_SERVICE_STATUS)[number]["icon"], LucideIcon> = {
  package: Package,
  "credit-card": CreditCard,
  clock: Clock3,
  message: MessageCircle,
};

export default function ServiceStatusSection() {
  return (
    <section className="service-status" aria-labelledby="service-status-title">
      <div className="service-status__inner">
        <Reveal as="header" className="service-status__header">
          <p className="service-status__eyebrow premium-section-eyebrow">Service status</p>
          <h2 id="service-status-title" className="service-status__title">
            Everything you need, clearly in view
          </h2>
          <p className="service-status__subtitle">
            Orders, payments, dispatch, and support — transparent at every step.
          </p>
        </Reveal>

        <RevealGroup className="service-status__grid">
          {LANDING_SERVICE_STATUS.map((item) => {
            const Icon = ICONS[item.icon];
            return (
              <article key={item.title} className="service-status__card">
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
                  <span className="service-status__cta-arrow" aria-hidden>
                    →
                  </span>
                </Link>
              </article>
            );
          })}
        </RevealGroup>
      </div>
    </section>
  );
}
