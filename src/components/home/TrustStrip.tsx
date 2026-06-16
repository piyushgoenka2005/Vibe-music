import { Truck, ShieldCheck, RotateCcw, Headphones } from "lucide-react";
import { LANDING_TRUST_ITEMS } from "@/data/landingStatus";
import StatusChip from "@/components/home/StatusChip";
import Reveal from "@/components/layout/Reveal";

const ICONS = {
  truck: Truck,
  shield: ShieldCheck,
  return: RotateCcw,
  headphones: Headphones,
} as const;

export default function TrustStrip() {
  return (
    <Reveal as="section" className="trust-strip">
      <div className="trust-strip__inner">
        {LANDING_TRUST_ITEMS.map((item, index) => {
          const Icon = ICONS[item.icon];
          return (
            <Reveal key={item.title} className="trust-strip__item" delay={index * 80}>
              <span className="trust-strip__icon-wrap" aria-hidden>
                <Icon size={20} className="trust-strip__icon" />
              </span>
              <div className="trust-strip__copy">
                <div className="trust-strip__title-row">
                  <p className="trust-strip__title">{item.title}</p>
                  <StatusChip
                    label={item.status}
                    tone={item.tone}
                    showDot={item.tone === "live"}
                    className="trust-strip__chip"
                  />
                </div>
                <p className="trust-strip__desc">{item.desc}</p>
              </div>
            </Reveal>
          );
        })}
      </div>
    </Reveal>
  );
}
