import SocialPlatformIcon from "@/components/layout/SocialPlatformIcon";
import type { SocialRailLink, SocialRailPublicConfig } from "@/lib/socialRail";

interface SocialRailProps {
  config: SocialRailPublicConfig;
}

export default function SocialRail({ config }: SocialRailProps) {
  const { links, newsletter } = config;

  if (links.length === 0 && !newsletter) return null;

  return (
    <aside className="social-rail" aria-label="Social navigation">
      {links.length > 0 ? (
        <nav aria-label="Social media">
          <ul className="social-rail__list">
            {links.map((link: SocialRailLink) => (
              <li key={link.platform}>
                <a
                  href={link.href}
                  className="social-rail__link"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={
                    link.platform === "whatsapp"
                      ? "Chat with Vibe Music on WhatsApp"
                      : `Follow Vibe Music on ${link.label}`
                  }
                >
                  <SocialPlatformIcon platform={link.platform} />
                </a>
              </li>
            ))}
          </ul>
        </nav>
      ) : null}

      {newsletter ? (
        <a
          href={newsletter.href}
          className="social-rail__newsletter"
          aria-label={`${newsletter.label} — subscribe to newsletter`}
        >
          <span className="social-rail__newsletter-text">{newsletter.label}</span>
        </a>
      ) : null}
    </aside>
  );
}
