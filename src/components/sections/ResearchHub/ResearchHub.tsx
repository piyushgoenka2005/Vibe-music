const articles = [
  {
    title: "Best Studio Setup Guide",
    category: "Buying Guide",
    image: "https://media.vibemusic.in/m/promotions/2025/1202_CyberWeek/Homepage-Takeover/Adjacency4Up/1202-CyberWeek-Adjacency-Headphones-HPFeatured-1600x1600.jpg",
  },
  {
    title: "Microphone Comparison",
    category: "Review",
    image: "https://media.vibemusic.in/m/products/image/052250cf73nOL3KRtEQEEmF9AByd84tPzCw64Ycd.jpg?quality=82&height=400",
  },
  {
    title: "Recording Tips For Beginners",
    category: "Tutorial",
    image: "https://media.vibemusic.in/m/promotions/2025/1201_CyberMonday/HPTakeover/Adjacency4Up/1201-CyberMonday-Adjacency-Canon-HPFeatured-1600x1600.jpg",
  },
  {
    title: "Industry Trends 2026",
    category: "News",
    image: "https://media.vibemusic.in/m/home/0817-gx-new-homepagetile.jpg?format=webp",
  },
];

export default function ResearchHub() {
  return (
    <section className="sw-section border-b border-[var(--grey10)] bg-white">
      <div className="sw-container">
        <h2 className="sw-section-heading">Your Research Destination</h2>
        <p className="sw-section-subheading mb-8">
          Buying guides, reviews, and tutorials from our experts.
        </p>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {articles.map((article) => (
            <a
              key={article.title}
              href="#"
              className="group block overflow-hidden rounded border border-[var(--grey10)] bg-white"
            >
              <div className="aspect-[4/3] overflow-hidden bg-[var(--grey0)]">
                <img
                  src={article.image}
                  alt={article.title}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              </div>
              <div className="p-4">
                <span className="mb-2 inline-block text-[12px] font-semibold uppercase tracking-wide text-[var(--blue)]">
                  {article.category}
                </span>
                <h3 className="text-[15px] font-semibold leading-snug text-[var(--grey100)] group-hover:text-[var(--blue)]">
                  {article.title}
                </h3>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
