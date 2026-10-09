import SocialPlatformIcon from "@/components/layout/SocialPlatformIcon";
import {
  getFooterNewsletterHref,
  getFooterNewsletterLabel,
  getFooterSocialLinks,
} from "@/lib/footerSocialLinks";

const ICON_SIZE = 18;

/** Mobile / tablet footer band — compact icons between newsletter and accordions. */
export default function FooterSocialIcons() {
  const links = getFooterSocialLinks();
  const newsletterHref = getFooterNewsletterHref();
  const newsletterLabel = getFooterNewsletterLabel();

  return (
    <nav className="site-footer-social" aria-label="Follow Vibe Music">
      <ul className="site-footer-social__list">
        {links.map((link) => (
          <li key={link.platform}>
            <a
              href={link.href}
              className="site-footer-social__link"
              target="_blank"
              rel="noopener noreferrer"
              aria-label={
                link.platform === "whatsapp"
                  ? "Chat with Vibe Music on WhatsApp"
                  : `Follow Vibe Music on ${link.label}`
              }
            >
              <SocialPlatformIcon platform={link.platform} size={ICON_SIZE} />
            </a>
          </li>
        ))}
        <li className="site-footer-social__newsletter-item">
          <a
            href={newsletterHref}
            className="site-footer-social__newsletter-pill"
            aria-label={`${newsletterLabel} — subscribe to newsletter`}
          >
            <span className="site-footer-social__newsletter-text">{newsletterLabel}</span>
          </a>
        </li>
      </ul>
    </nav>
  );
}
