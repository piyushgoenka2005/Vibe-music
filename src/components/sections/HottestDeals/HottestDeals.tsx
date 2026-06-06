const deals = [
  {
    title: "Recording Equipment",
    discount: "UP TO 50% OFF",
    image: "https://media.sweetwater.com/m/promotions/2025/1202_CyberWeek/Homepage-Takeover/Adjacency4Up/1202-CyberWeek-Adjacency-Headphones-HPFeatured-1600x1600.jpg",
  },
  {
    title: "Premium Guitars",
    discount: "UP TO 40% OFF",
    image: "https://media.sweetwater.com/m/products/image/d55a7ca800bRKFzzzI1LkoPdgD1ymbxu18tLjQgI.png",
  },
  {
    title: "Studio Monitors",
    discount: "UP TO 35% OFF",
    image: "https://media.sweetwater.com/m/products/image/052250cf73nOL3KRtEQEEmF9AByd84tPzCw64Ycd.jpg?quality=82&height=400",
  },
  {
    title: "DJ Controllers",
    discount: "UP TO 30% OFF",
    image: "https://media.sweetwater.com/m/promotions/2025/1202_CyberWeek/Homepage-Takeover/Adjacency4Up/1202-CyberWeek-Adjacency-Bluetooth-HPFeatured-1600x1600.jpg",
  },
];

export default function HottestDeals() {
  return (
    <section className="sw-section border-b border-[var(--grey10)] bg-[var(--grey0)]">
      <div className="sw-container">
        <h2 className="sw-section-heading">Hottest Deals</h2>
        <p className="sw-section-subheading mb-8">
          Save big on the gear you want most.
        </p>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {deals.map((deal) => (
            <a
              key={deal.title}
              href="#"
              className="group relative block min-h-[240px] overflow-hidden rounded border border-[var(--grey10)] bg-white"
            >
              <img
                src={deal.image}
                alt={deal.title}
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
              <div className="relative flex h-full min-h-[240px] flex-col justify-end p-5 text-white">
                <span className="mb-2 inline-block w-fit rounded bg-[var(--red)] px-2 py-1 text-[11px] font-semibold uppercase tracking-wide">
                  {deal.discount}
                </span>
                <h3 className="text-lg font-semibold">{deal.title}</h3>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
