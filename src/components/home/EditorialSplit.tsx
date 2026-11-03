import Link from "next/link";
import Image from "next/image";
import { ROUTES } from "@/lib/routes";
import { MARKETING_EDITORIAL_IMAGE } from "@/lib/categoryImages";
import { getGearAdvisorsPublicData } from "@/lib/server/homepage/homepageService";
import Reveal from "@/components/layout/Reveal";

export default async function EditorialSplit() {
  const content = await getGearAdvisorsPublicData();

  if (!content?.isActive) {
    return null;
  }

  const secondaryCtaText = content.secondaryCta?.text || "Read buying guides";
  const secondaryCtaHref = content.secondaryCta?.href || ROUTES.blog;

  return (
    <Reveal as="section" className="editorial-split" id={content ? "gear-advisors" : undefined}>
      <div className="editorial-split__inner">
        <div className="editorial-split__copy">
          <p className="editorial-split__eyebrow premium-section-eyebrow">{content.eyebrow}</p>
          <h2 className="editorial-split__title">{content.title}</h2>
          <p className="editorial-split__text">{content.subtitle}</p>
          <div className="editorial-split__actions">
            <Link href={content.cta.href} className="premium-btn premium-btn--primary">
              {content.cta.text}
            </Link>
            {secondaryCtaText ? (
              <Link href={secondaryCtaHref} className="premium-btn premium-btn--outline">
                {secondaryCtaText}
              </Link>
            ) : null}
          </div>
        </div>
        <div className="editorial-split__visual">
          <div className="editorial-split__card">
            <div className="editorial-split__orb" />
            <Image
              src={content.image.src || MARKETING_EDITORIAL_IMAGE}
              alt={
                content.image.alt ||
                "Professional electric guitar — expert gear advice for every player"
              }
              className="editorial-split__image"
              fill
              loading="lazy"
              sizes="(max-width: 640px) 90vw, (max-width: 1024px) 44vw, 500px"
            />
          </div>
        </div>
      </div>
    </Reveal>
  );
}
