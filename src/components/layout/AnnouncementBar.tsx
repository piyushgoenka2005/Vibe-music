const ANNOUNCEMENT_MESSAGE =
  "Free shipping on orders over ₹9,999 · Authorized brands · Secure checkout";

const MARQUEE_COPIES = 8;

export default function AnnouncementBar() {
  const row = Array.from({ length: MARQUEE_COPIES }, (_, index) => ({
    id: `announcement-${index}`,
    text: ANNOUNCEMENT_MESSAGE,
  }));
  const items = [...row, ...row].map((item, index) => ({
    ...item,
    id: `announcement-${index}`,
  }));

  return (
    <div className="announcement-bar" role="region" aria-label="Store announcement">
      <p className="visually-hidden">{ANNOUNCEMENT_MESSAGE}</p>

      <div className="announcement-bar__viewport" aria-hidden="true">
        <div className="announcement-bar__track">
          {items.map((item) => (
            <span key={item.id} className="announcement-bar__item">
              {item.text}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
