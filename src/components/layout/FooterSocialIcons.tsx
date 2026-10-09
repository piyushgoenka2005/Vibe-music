import SocialPlatformIcon from "@/components/layout/SocialPlatformIcon";
import { getFooterSocialLinks } from "@/lib/footerSocialLinks";

const ICON_SIZE = 18;

/** Mobile / tablet footer band — compact icons between newsletter and accordions. */
export default function FooterSocialIcons() {
  const links = getFooterSocialLinks();

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
      </ul>
    </nav>
  );
}
