interface EventCardProps {
  title: string;
  subtitle: string;
  image: string;
}

function EventCard({ title, subtitle, image }: EventCardProps) {
  return (
    <a href="#" className="group block overflow-hidden rounded border border-[var(--grey10)] bg-white">
      <div className="aspect-[16/9] overflow-hidden bg-[var(--grey0)]">
        <img
          src={image}
          alt={title}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
      </div>
      <div className="p-4">
        <h3 className="text-base font-medium text-[var(--grey100)] group-hover:text-[var(--blue)]">
          {title}
        </h3>
        <p className="mt-1 text-sm text-[var(--grey60)]">{subtitle}</p>
      </div>
    </a>
  );
}

const events = [
  {
    title: "Summer Savings Event",
    subtitle: "Huge discounts on instruments and accessories.",
    image: "/images/m/home/0817-gx-new-homepagetile.jpg?format=webp",
  },
  {
    title: "Studio Essentials Sale",
    subtitle: "Upgrade your recording setup today.",
    image: "/images/m/promotions/2025/1202_CyberWeek/Homepage-Takeover/Adjacency4Up/1202-CyberWeek-Adjacency-Headphones-HPFeatured-1600x1600.jpg",
  },
  {
    title: "Limited Time Offers",
    subtitle: "Exclusive deals available this week only.",
    image: "/images/m/promotions/2025/1201_CyberMonday/HPTakeover/Adjacency4Up/1201-CyberMonday-Adjacency-Canon-HPFeatured-1600x1600.jpg",
  },
];

export default function SalesEvents() {
  return (
    <section className="sw-section border-b border-[var(--grey10)] bg-[var(--grey0)]">
      <div className="sw-container">
        <h2 className="sw-section-heading">Sales Events</h2>
        <p className="sw-section-subheading mb-8">
          Discover current promotions and special campaigns.
        </p>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {events.map((event) => (
            <EventCard key={event.title} {...event} />
          ))}
        </div>
      </div>
    </section>
  );
}
