import "@/styles/find-your-product.css";
import FindYourProductRuntime from "@/components/home/find-your-product/FindYourProductRuntime";
import ScannerBagIcon from "@/components/home/find-your-product/ScannerBagIcon";
import ScannerBeam from "@/components/home/find-your-product/ScannerBeam";
import ScannerMarquee from "@/components/home/find-your-product/ScannerMarquee";
import type { ResolvedHomepageSection } from "@/types/homepage";
import { ROUTES } from "@/lib/routes";

interface FindYourProductSectionProps {
  section?: ResolvedHomepageSection;
}

export default function FindYourProductSection({ section }: FindYourProductSectionProps = {}) {
  const title = section?.title || "Find Your Product";
  const subtitle =
    section?.subtitle || "Curated departments for every stage — from bedroom studio to main stage.";
  const eyebrow = section?.accentLabel || "Shop by category";
  const ctaText = section?.ctaText || "Browse all categories";
  const ctaLink = section?.ctaLink || ROUTES.categories;

  return (
    <div className="find-your-product" data-find-your-product id="find-your-product">
      <FindYourProductRuntime />

      <header className="find-your-product__header">
        <p className="find-your-product__eyebrow">
          <span className="find-your-product__eyebrow-line" aria-hidden />
          {eyebrow}
          <span className="find-your-product__eyebrow-line" aria-hidden />
        </p>
        <h2 id="find-your-product-title" className="find-your-product__title">
          {title}
        </h2>
        <p className="find-your-product__subtitle">{subtitle}</p>
      </header>

      <section
        className="find-your-product__stage"
        aria-labelledby="find-your-product-title"
        aria-label="Find your product — trending gear"
      >
        <div className="find-your-product__spine" aria-hidden>
          <span className="find-your-product__spine-seg find-your-product__spine-seg--up" />
        </div>

        <ScannerMarquee />

        <div className="find-your-product__junction" aria-hidden>
          <div className="find-your-product__icon">
            <ScannerBagIcon />
          </div>
        </div>

        <ScannerBeam
          ctaText={ctaText}
          ctaLink={ctaLink}
          secondaryCtaText="Browse all"
          secondaryCtaLink={ROUTES.search}
        />
      </section>
    </div>
  );
}
