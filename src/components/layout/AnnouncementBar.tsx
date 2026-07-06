import Marquee from "@/components/common/Marquee";

const ANNOUNCEMENT_MESSAGE =
  "Free shipping on orders over ₹2,999 · Authorized brands · Secure checkout";

export default function AnnouncementBar() {
  return (
    <div className="announcement-bar" role="region" aria-label="Store announcement">
      <p className="visually-hidden">{ANNOUNCEMENT_MESSAGE}</p>

      <div className="announcement-bar__viewport" aria-hidden="true">
        <Marquee
          className="announcement-bar__marquee"
          trackClassName="announcement-bar__track"
          sequenceClassName="announcement-bar__sequence"
          duration="32s"
        >
          <span className="announcement-bar__item">{ANNOUNCEMENT_MESSAGE}</span>
        </Marquee>
      </div>
    </div>
  );
}
