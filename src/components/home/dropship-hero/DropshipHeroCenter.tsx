import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { ROUTES } from "@/lib/routes";
import DropshipLogoIcon from "@/components/home/dropship-hero/DropshipLogoIcon";

export default function DropshipHeroCenter() {
  return (
    <div className="dropship-hero-center">
      <div className="dropship-hero-junction" aria-hidden>
        <div className="dropship-hero-icon">
          <DropshipLogoIcon />
        </div>
      </div>

      <div className="dropship-hero-beam-zone">
        <div className="dropship-hero-beam" aria-hidden>
          <svg
            className="dropship-hero-beam__svg"
            viewBox="0 0 1200 680"
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient
                id="dropship-beam-fill"
                x1="600"
                y1="0"
                x2="600"
                y2="680"
                gradientUnits="userSpaceOnUse"
              >
                <stop offset="0%" stopColor="#60a5fa" />
                <stop offset="28%" stopColor="#3b82f6" />
                <stop offset="68%" stopColor="#2563eb" />
                <stop offset="100%" stopColor="#1d4ed8" />
              </linearGradient>
            </defs>
            <path
              className="dropship-hero-beam__core"
              d="M 600 0 C 614 0 624 28 642 82 C 688 215 795 430 1070 610 C 1130 648 1165 670 1184 676 C 1198 680 1184 680 1128 680 L 72 680 C 16 680 2 680 16 676 C 35 670 70 648 130 610 C 405 430 512 215 558 82 C 576 28 586 0 600 0 Z"
              fill="url(#dropship-beam-fill)"
            />
          </svg>
        </div>

        <div className="dropship-hero-content">
          <h3 className="dropship-hero-content__title">Gear built for every stage</h3>
          <div className="dropship-hero-content__actions">
            <Link href={ROUTES.deals} className="dropship-hero-cta">
              Shop deals
            </Link>
            <Link href={ROUTES.search} className="dropship-hero-cta dropship-hero-cta--outline">
              Browse all
            </Link>
          </div>
        </div>

        <p className="dropship-hero-label">
          <Link href={ROUTES.deals} className="dropship-hero-label__link">
            Find your gear
            <ArrowUpRight className="dropship-hero-label__arrow" size={20} strokeWidth={2.25} aria-hidden />
          </Link>
        </p>
      </div>
    </div>
  );
}
