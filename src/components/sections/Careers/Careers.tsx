import Link from "next/link";
import { CAREERS, type CareersCta } from "@/data/careers";
import { resolveLinkHref } from "@/lib/routes";

function featuredImageClassName(hidden?: boolean): string {
  return hidden ? "hc-featured-image hidden" : "hc-featured-image";
}

function ctaClassName(variant: CareersCta["variant"]): string {
  return variant === "primary"
    ? "sds-button sds-button__primary"
    : "sds-button sds-button__secondary";
}

/** Homepage careers recruitment block (`#careers`). */
export default function Careers() {
  const { sectionId, featuredImages, bannerImage, title, copy, ctas } =
    CAREERS;

  return (
    <section id={sectionId} className="homepage-careers">
      <div className="hc-container">
        <div className="hc-feature-images">
          {featuredImages.map((image) => (
            <img
              key={image.src}
              className={featuredImageClassName(image.hidden)}
              src={image.src}
              alt={image.alt}
              width="100%"
              height="100%"
            />
          ))}
        </div>
        <div className="hc-content">
          <div className="hc-content__banner">
            <img
              className="hc-banner-image"
              src={bannerImage.src}
              alt={bannerImage.alt}
              width="100%"
              height="100%"
            />
          </div>
          <div className="hc-content__details">
            <h2 className="hc-content__title">{title}</h2>
            <p className="hc-content__copy">{copy}</p>
            <div className="hc-content__cta">
              {ctas.map((cta) => (
                <Link
                  key={cta.href}
                  href={resolveLinkHref(cta.href)}
                  className={ctaClassName(cta.variant)}
                >
                  <span className="sds-button__text-container">
                    <span className="sds-button__text">{cta.label}</span>
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
