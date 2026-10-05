import Marquee from "@/components/common/Marquee";
import { SHIPPING_POLICY } from "@/lib/storefront/shippingPolicy";

/** Enough copies per sequence to cover ultra-wide viewports before the clone takes over. */
const SEQUENCE_COPIES = 8;

interface AnnouncementBarProps {
  announcement?: string;
}

export default function AnnouncementBar({
  announcement = SHIPPING_POLICY.announcement,
}: AnnouncementBarProps) {
  const announcementMessage = `${announcement} · Authorized brands · Secure checkout`;

  const sequence = Array.from({ length: SEQUENCE_COPIES }, (_, index) => (
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
