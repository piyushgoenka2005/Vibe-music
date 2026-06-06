const tiles = [
  {
    title: "Gear Exchange",
    description: "Buy and sell used gear with confidence.",
    image: "https://media.sweetwater.com/m/home/0817-gx-new-homepagetile.jpg?format=webp",
  },
  {
    title: "Studio Essentials",
    description: "Everything needed for professional recording.",
    image: "https://media.sweetwater.com/m/promotions/2025/1202_CyberWeek/Homepage-Takeover/Adjacency4Up/1202-CyberWeek-Adjacency-Headphones-HPFeatured-1600x1600.jpg",
  },
  {
    title: "Live Performance Gear",
    description: "Powerful sound systems and stage equipment.",
    image: "https://media.sweetwater.com/m/promotions/2025/1202_CyberWeek/Homepage-Takeover/Adjacency4Up/1202-CyberWeek-Adjacency-Bluetooth-HPFeatured-1600x1600.jpg",
  },
];

export default function HeroTiles() {
  return (
    <section className="sw-section border-b border-[var(--grey10)] bg-white">
      <div className="sw-container">
        <div className="grid gap-4 lg:grid-cols-3">
          {tiles.map((tile) => (
            <a
              key={tile.title}
              href="#"
              className="group relative block min-h-[220px] overflow-hidden rounded border-2 border-[var(--red)] bg-white"
            >
              <img
                src={tile.image}
                alt={tile.title}
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
              <div className="relative flex h-full min-h-[220px] flex-col justify-end p-6 text-white">
                <h3 className="text-xl font-semibold">{tile.title}</h3>
                <p className="mt-1 text-sm text-white/85">{tile.description}</p>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
