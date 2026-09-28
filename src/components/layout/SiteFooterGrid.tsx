import Link from "next/link";
import { BRAND } from "@/lib/brand";
import { ROUTES } from "@/lib/routes";
import FooterAccordion from "@/components/layout/FooterAccordion";
import FooterClock from "@/components/layout/FooterClock";
import { buildFooterSections } from "@/components/layout/siteFooterSections";
import type { PublicLegalInfo } from "@/types/publicLegal";

export default function SiteFooterGrid({ legal }: { legal: PublicLegalInfo }) {
  const year = new Date().getFullYear();
  const footerSections = buildFooterSections(legal);

  return (
    <div className="site-footer__grid">
      <FooterAccordion sections={footerSections} />

      <div className="site-footer-base">
        <div className="site-footer-base__item">
          ©{year} /{" "}
          <Link href={ROUTES.home} title={BRAND.name}>
            {BRAND.name}
          </Link>
        </div>
        <div className="site-footer-base__item">
          <FooterClock />
        </div>
        <div className="site-footer-base__item site-footer-base__item--tagline">
          Pro Audio · Instruments · Studio Gear
        </div>
      </div>
    </div>
  );
}
