import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { ROUTES } from "@/lib/routes";

interface ScannerBeamProps {
  title?: string;
  ctaText?: string;
  ctaLink?: string;
  secondaryCtaText?: string;
  secondaryCtaLink?: string;
}

export default function ScannerBeam({
  title = "Gear built for every stage",
  ctaText = "Shop deals",
  ctaLink = ROUTES.deals,
  secondaryCtaText = "Browse all",
  secondaryCtaLink = ROUTES.search,
}: ScannerBeamProps) {
  return (
    <div className="find-your-product__beam-zone">
      <div className="find-your-product__beam" aria-hidden>
        <svg
          className="find-your-product__beam-svg"
          viewBox="0 0 1200 680"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient
              id="find-your-product-beam-fill"
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
            d="M 600 0 C 614 0 624 28 642 82 C 688 215 795 430 1070 610 C 1130 648 1165 670 1184 676 C 1198 680 1184 680 1128 680 L 72 680 C 16 680 2 680 16 676 C 35 670 70 648 130 610 C 405 430 512 215 558 82 C 576 28 586 0 600 0 Z"
            fill="url(#find-your-product-beam-fill)"
          />
        </svg>
      </div>

      <div className="find-your-product__content">
        <h3 className="find-your-product__content-title">{title}</h3>
        <div className="find-your-product__content-actions">
          <Link href={ctaLink} className="find-your-product__cta">
            {ctaText}
          </Link>
          <Link
            href={secondaryCtaLink}
            className="find-your-product__cta find-your-product__cta--outline"
          >
            {secondaryCtaText}
          </Link>
        </div>
      </div>

      <p className="find-your-product__label">
        <Link href={secondaryCtaLink} className="find-your-product__label-link">
          Find your gear
          <ArrowUpRight
            className="find-your-product__label-arrow"
            size={20}
            strokeWidth={2.25}
            aria-hidden
          />
        </Link>
      </p>
    </div>
  );
}
