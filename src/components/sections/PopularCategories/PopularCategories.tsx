import Link from "next/link";
import { POPULAR_CATEGORIES } from "@/lib/constants";

const categoryImages: Record<string, string> = {
  Guitars: "https://media.vibemusic.in/m/products/image/d55a7ca800bRKFzzzI1LkoPdgD1ymbxu18tLjQgI.png",
  Bass: "https://media.vibemusic.in/m/products/image/d8c2bbdeccm3Y090lrRNsEkbuepCOgoAPS5sINA5.png",
  "Studio & Recording": "https://media.vibemusic.in/m/products/image/b26fe96b93ir7YHzi8IW3B2sVDCy1V9ynJFdMPr2.jpg?quality=82&width=400&format=webp",
  "Drums & Percussion": "https://media.vibemusic.in/m/products/image/052250cf73nOL3KRtEQEEmF9AByd84tPzCw64Ycd.jpg?quality=82&height=400",
  "Keyboards & Synthesizers": "https://media.vibemusic.in/m/products/image/b26fe96b93ir7YHzi8IW3B2sVDCy1V9ynJFdMPr2.jpg?quality=82&width=750&format=webp",
  "Live Sound & Lighting": "https://media.vibemusic.in/m/promotions/2025/1202_CyberWeek/Homepage-Takeover/Adjacency4Up/1202-CyberWeek-Adjacency-Bluetooth-HPFeatured-1600x1600.jpg",
  "Software & Plug-ins": "https://media.vibemusic.in/m/promotions/2025/1201_CyberMonday/HPTakeover/Adjacency4Up/1201-CyberMonday-Adjacency-Canon-HPFeatured-1600x1600.jpg",
  "DJ Equipment": "https://media.vibemusic.in/m/promotions/2025/1202_CyberWeek/Homepage-Takeover/Adjacency4Up/1202-CyberWeek-Adjacency-HA-HPFeatured-1600x1600.jpg",
  "Microphones & Wireless": "https://media.vibemusic.in/m/promotions/2025/1202_CyberWeek/Homepage-Takeover/Adjacency4Up/1202-CyberWeek-Adjacency-Headphones-HPFeatured-1600x1600.jpg",
};

interface CategoryCardProps {
  title: string;
}

function CategoryCard({ title }: CategoryCardProps) {
  const image =
    categoryImages[title] ??
    "https://media.vibemusic.in/m/products/image/d55a7ca800bRKFzzzI1LkoPdgD1ymbxu18tLjQgI.png";

  return (
    <Link href="#" className="group block text-center">
      <div className="mx-auto mb-3 flex aspect-square max-w-[120px] items-center justify-center overflow-hidden rounded-full bg-[var(--grey0)] p-4 transition group-hover:bg-white group-hover:shadow-[0_2px_8px_rgba(0,0,0,0.08)]">
        <img
          src={image}
          alt={title}
          className="h-full w-full object-contain transition-transform group-hover:scale-105"
        />
      </div>
      <p className="text-[13px] leading-snug text-[var(--grey100)] group-hover:text-[var(--blue)]">
        {title}
      </p>
    </Link>
  );
}

export default function PopularCategories() {
  return (
    <section className="sw-section border-b border-[var(--grey10)] bg-[var(--grey0)]">
      <div className="sw-container">
        <h2 className="sw-section-heading">Popular Categories</h2>

        <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7">
          {POPULAR_CATEGORIES.map((category) => (
            <CategoryCard key={category} title={category} />
          ))}
        </div>
      </div>
    </section>
  );
}
