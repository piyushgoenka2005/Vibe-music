const ANNOUNCEMENT_MESSAGE = "Free shipping on all orders · Authorized brands · Secure checkout";

export default function AnnouncementBar() {
  const items = Array.from({ length: 4 }, (_, index) => ({
    id: `announcement-${index}`,
    text: ANNOUNCEMENT_MESSAGE,
  }));

  return (
    <div
      className="announcement-bar"
      role="region"
      aria-label={`Store announcement: ${ANNOUNCEMENT_MESSAGE}`}
    >
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
