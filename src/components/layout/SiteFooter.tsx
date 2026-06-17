import Link from "next/link";
import Image from "next/image";
import { BRAND } from "@/lib/brand";
import { ROUTES, categoryPath } from "@/lib/routes";

const FOOTER_SHOP = [
  { label: "Guitars", href: categoryPath("guitars") },
  { label: "Studio & Recording", href: categoryPath("studio-recording") },
  { label: "Drums", href: categoryPath("drums-percussion") },
  { label: "Keyboards", href: categoryPath("keyboards-synthesizers") },
  { label: "All Categories", href: ROUTES.search },
];

const FOOTER_SUPPORT = [
  { label: "Track Order", href: ROUTES.trackOrder },
  { label: "Contact Support", href: `mailto:${BRAND.email}` },
  { label: "Product Support", href: ROUTES.search },
];

const FOOTER_COMPANY = [
  { label: "About Vibe Music", href: ROUTES.search },
  { label: "Blog & Guides", href: ROUTES.blog },
  { label: "Financing", href: `${ROUTES.search}?q=financing` },
];

export default function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="site-footer" data-vibe-section="footer">
      <div className="site-footer__inner">
        <div className="site-footer__brand">
          <Link href={ROUTES.home} className="site-footer__logo" aria-label={`${BRAND.name} home`}>
            <Image
              src={BRAND.headerLogoPath}
              alt={BRAND.name}
              width={240}
              height={62}
              className="site-footer__logo-img"
            />
          </Link>
          <p className="site-footer__tagline">{BRAND.tagline}</p>
          <p className="site-footer__desc">{BRAND.description}</p>
        </div>

        <div className="site-footer__columns">
          <div className="site-footer__col">
            <h3 className="site-footer__heading">Shop</h3>
            <ul className="site-footer__links">
              {FOOTER_SHOP.map((link) => (
                <li key={link.href}>
                  <Link href={link.href}>{link.label}</Link>
                </li>
              ))}
            </ul>
          </div>
          <div className="site-footer__col">
            <h3 className="site-footer__heading">Support</h3>
            <ul className="site-footer__links">
              {FOOTER_SUPPORT.map((link) => (
                <li key={link.label}>
                  <Link href={link.href}>{link.label}</Link>
                </li>
              ))}
            </ul>
          </div>
          <div className="site-footer__col">
            <h3 className="site-footer__heading">Company</h3>
            <ul className="site-footer__links">
              {FOOTER_COMPANY.map((link) => (
                <li key={link.href}>
                  <Link href={link.href}>{link.label}</Link>
                </li>
              ))}
            </ul>
          </div>
          <div className="site-footer__col">
            <h3 className="site-footer__heading">Connect</h3>
            <ul className="site-footer__links">
              <li>
                <a href={`tel:${BRAND.phoneTel}`}>{BRAND.phoneDisplay}</a>
              </li>
              <li>
                <a href={`mailto:${BRAND.email}`}>{BRAND.email}</a>
              </li>
              <li>{BRAND.address}</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="site-footer__bottom">
        <p>© {year} {BRAND.name}. All rights reserved.</p>
        <p className="site-footer__payments">Secure payments via Razorpay · UPI · Cards</p>
      </div>
    </footer>
  );
}
