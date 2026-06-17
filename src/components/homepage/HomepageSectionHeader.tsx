import Link from "next/link";
import { resolveLinkHref } from "@/lib/routes";
import SECTION_CTA_ARROW from "@/components/homepage/SectionCtaArrow";

interface HomepageSectionHeaderProps {
  title: string;
  titleId?: string;
  subtitle?: string;
  ctaText?: string;
  ctaLink?: string;
}

export default function HomepageSectionHeader({
  title,
  titleId,
  subtitle,
  ctaText,
  ctaLink,
}: HomepageSectionHeaderProps) {
  return (
    <header className="homepage-section__header">
      <div className="homepage-section__header-copy">
        <h2 id={titleId}>{title}</h2>
        {subtitle ? (
          <p className="homepage-section__subtitle">{subtitle}</p>
        ) : null}
      </div>
      {ctaText && ctaLink ? (
        <Link
          className="homepage-section__cta-btn"
          href={resolveLinkHref(ctaLink)}
        >
          {ctaText}
          {SECTION_CTA_ARROW}
        </Link>
      ) : null}
    </header>
  );
}
