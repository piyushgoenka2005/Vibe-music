import ProductCard from "./ProductCard";

const products = [
  {
    name: "Fender Player Stratocaster",
    price: "$849.99",
    image: "https://media.sweetwater.com/m/products/image/d55a7ca800bRKFzzzI1LkoPdgD1ymbxu18tLjQgI.png",
  },
  {
    name: "Yamaha P-225 Digital Piano",
    price: "$699.99",
    image: "https://media.sweetwater.com/m/products/image/b26fe96b93ir7YHzi8IW3B2sVDCy1V9ynJFdMPr2.jpg?quality=82&width=400&format=webp",
  },
  {
    name: "Focusrite Scarlett Solo",
    price: "$119.99",
    image: "https://media.sweetwater.com/m/products/image/052250cf73nOL3KRtEQEEmF9AByd84tPzCw64Ycd.jpg?quality=82&height=400",
  },
  {
    name: "Shure SM7B Microphone",
    price: "$399.00",
    image: "https://media.sweetwater.com/m/promotions/2025/1202_CyberWeek/Homepage-Takeover/Adjacency4Up/1202-CyberWeek-Adjacency-Headphones-HPFeatured-1600x1600.jpg",
  },
];

export default function SuggestedProducts() {
  return (
    <section className="sw-section border-b border-[var(--grey10)] bg-white">
      <div className="sw-container">
        <h2 className="sw-section-heading">Suggested For You</h2>
        <p className="sw-section-subheading mb-8">
          Hand-picked gear based on trending products.
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
