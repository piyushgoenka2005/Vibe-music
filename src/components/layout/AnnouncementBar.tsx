import Link from "next/link";
import {
  Truck,
  ShieldCheck,
  Headphones,
  Package,
  HelpCircle,
  Phone,
  Clock,
  Sparkles,
  MapPin,
  Info,
} from "lucide-react";
import Marquee from "@/components/common/Marquee";
import { SHIPPING_POLICY } from "@/lib/storefront/shippingPolicy";
import type { NavigationMenuItemRecord } from "@/lib/server/navigation/navigationRepository";

const ICON_MAP: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  Truck,
  ShieldCheck,
  Headphones,
  Package,
  HelpCircle,
  Phone,
  Clock,
  Sparkles,
  MapPin,
  Info,
};

interface AnnouncementBarProps {
  announcement?: string;
  items?: NavigationMenuItemRecord[];
  active?: boolean;
}

export default function AnnouncementBar({
  announcement = SHIPPING_POLICY.announcement,
  items,
  active = true,
}: AnnouncementBarProps) {
  if (active === false) return null;

  const activeItems = items && items.length > 0 ? items.filter((i) => i.isActive) : null;

  if (activeItems && activeItems.length > 0) {
    const utilitySequence = Array.from({ length: 6 }, (_, sequenceIndex) =>
      activeItems.map((item) => {
        const IconComponent = item.icon ? ICON_MAP[item.icon] : null;
        const content = (
          <span className="announcement-bar__utility-item">
            {IconComponent ? <IconComponent size={13} className="announcement-bar__icon" /> : null}
            <span>{item.label}</span>
          </span>
        );

        return item.url && item.url !== "#" ? (
          <Link
            key={`${item.id}-${sequenceIndex}`}
            href={item.url}
            className="announcement-bar__utility-link"
            target={item.openInNewTab ? "_blank" : undefined}
            rel={item.openInNewTab ? "noopener noreferrer" : undefined}
          >
            {content}
          </Link>
        ) : (
          <span key={`${item.id}-${sequenceIndex}`}>{content}</span>
        );
      }),
    ).flat();

    return (
      <div
        className="announcement-bar announcement-bar--utility"
        role="region"
        aria-label="Scrolling store announcements and utility navigation"
      >
        <Marquee
          className="announcement-bar__marquee"
          trackClassName="announcement-bar__marquee-track"
          sequenceClassName="announcement-bar__marquee-sequence"
          duration="var(--announcement-marquee-duration, 35s)"
          pauseOnHover={false}
          role="presentation"
        >
          {utilitySequence}
        </Marquee>
      </div>
    );
  }

  // Fallback default marquee
  const announcementMessage = `${announcement} · Authorized brands · Secure checkout`;
  const sequence = Array.from({ length: 6 }, (_, index) => (
    <span key={index} className="announcement-bar__item">
      {announcementMessage}
    </span>
  ));

  return (
    <div
      className="announcement-bar"
      role="region"
      aria-label={`Store announcement: ${announcementMessage}`}
    >
      <Marquee
        className="announcement-bar__marquee"
        trackClassName="announcement-bar__marquee-track"
        sequenceClassName="announcement-bar__marquee-sequence"
        duration="var(--announcement-marquee-duration, 40s)"
        pauseOnHover={false}
        role="presentation"
      >
        {sequence}
      </Marquee>
    </div>
  );
}
