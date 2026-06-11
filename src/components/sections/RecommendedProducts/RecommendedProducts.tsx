import ProductCard from "../SuggestedProducts/ProductCard";
import { formatCurrency, usdToInr } from "@/utils/currency";

const products = [
  {
    name: "Gibson Les Paul Standard",
    price: formatCurrency(usdToInr(2999)),
    image: "/images/m/products/image/d55a7ca800bRKFzzzI1LkoPdgD1ymbxu18tLjQgI.png",
  },
  {
    name: "Yamaha HS8 Studio Monitor",
    price: formatCurrency(usdToInr(799)),
    image: "/images/m/products/image/052250cf73nOL3KRtEQEEmF9AByd84tPzCw64Ycd.jpg?quality=82&height=400",
  },
  {
    name: "Ableton Push 3",
    price: formatCurrency(usdToInr(1999)),
    image: "/images/m/products/image/b26fe96b93ir7YHzi8IW3B2sVDCy1V9ynJFdMPr2.jpg?quality=82&width=400&format=webp",
  },
  {
    name: "Pioneer DJ Controller",
    price: formatCurrency(usdToInr(1299)),
    image: "/images/m/promotions/2025/1202_CyberWeek/Homepage-Takeover/Adjacency4Up/1202-CyberWeek-Adjacency-Bluetooth-HPFeatured-1600x1600.jpg",
  },
];

export default function RecommendedProducts() {
  return (
    <section className="sw-section border-b border-[var(--grey10)] bg-white">
      <div className="sw-container">
        <h2 className="sw-section-heading">Gear Exchange Picks</h2>
        <p className="sw-section-subheading mb-8">
          Score great used gear with confidence.
        </p>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product.name} {...product} />
          ))}
        </div>
      </div>
    </section>
  );
}
