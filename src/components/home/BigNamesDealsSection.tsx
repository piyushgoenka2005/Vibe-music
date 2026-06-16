import Image from "next/image";
import Link from "next/link";
import BigNamesTypewriterHeadline from "@/components/home/BigNamesTypewriterHeadline";
import { ROUTES } from "@/lib/routes";

const DEALS_CTA_HREF = `${ROUTES.searchResults}?q=deals`;

const DEAL_BRANDS = [
  {
    brand: "Gibson",
    href: `${ROUTES.searchResults}?brand=gibson`,
    logo: "/images/big-names-deals/gibson-logo.svg",
    product: "/images/big-names-deals/gibson-product.png",
  },
  {
    brand: "Epiphone",
    href: `${ROUTES.searchResults}?brand=epiphone`,
    logo: "/images/big-names-deals/epiphone-logo.svg",
    product: "/images/big-names-deals/epiphone-product.png",
  },
  {
    brand: "PRS",
    href: `${ROUTES.searchResults}?brand=prs`,
    logo: "/images/big-names-deals/prs-logo.svg",
    product: "/images/big-names-deals/prs-product.png",
  },
  {
    brand: "Ibanez",
    href: `${ROUTES.searchResults}?brand=ibanez`,
    logo: "/images/big-names-deals/ibanez-logo.svg",
    product: "/images/big-names-deals/ibanez-product.png",
  },
  {
    brand: "Fender",
    href: `${ROUTES.searchResults}?brand=fender`,
    logo: "/images/big-names-deals/fender-logo.svg",
    product: "/images/big-names-deals/fender-product.png",
  },
] as const;

export default function BigNamesDealsSection() {
  return (
    <section
      className="full-width-feature-sale-banner"
      aria-labelledby="fullWidthFeatureSaleBannerHeadline"
    >
      <div className="full-width-feature-sale-banner__ambient-fog" aria-hidden="true" />
      <div className="full-width-feature-sale-banner__edge-fade-left" aria-hidden="true" />
      <div className="full-width-feature-sale-banner__edge-fade-right" aria-hidden="true" />

      <BigNamesTypewriterHeadline id="fullWidthFeatureSaleBannerHeadline" />

      <p className="full-width-feature-sale-banner__supporting-copy">
        Find all the top brands you already love, at prices that simply can&apos;t be beat
      </p>

      <div className="full-width-feature-sale-banner__brand-product-row scrollbar-minimal">
        {DEAL_BRANDS.map((item) => (
          <div className="full-width-feature-sale-banner__brand-product-card" key={item.brand}>
            <Link
              aria-label={`Shop ${item.brand} deals`}
              className="full-width-feature-sale-banner__brand-product-link"
              href={item.href}
            >
              <div className="full-width-feature-sale-banner__brand-logo-wrap">
                <Image
                  alt={`${item.brand} logo`}
                  className="full-width-feature-sale-banner__brand-logo"
                  height={28}
                  src={item.logo}
                  width={120}
                />
              </div>
              <Image
                alt={`${item.brand} guitar`}
                className="full-width-feature-sale-banner__brand-product-image"
                height={360}
                src={item.product}
                width={240}
              />
            </Link>
          </div>
        ))}
      </div>

      <Link className="full-width-feature-sale-banner__primary-cta" href={DEALS_CTA_HREF}>
        Shop All Deals
      </Link>
    </section>
  );
}
