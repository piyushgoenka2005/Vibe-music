import ProductCard from "../SuggestedProducts/ProductCard";

const arrivals = [
  {
    name: "Roland Fantom-08",
    price: "$3,499.99",
    image: "https://media.sweetwater.com/m/products/image/b26fe96b93ir7YHzi8IW3B2sVDCy1V9ynJFdMPr2.jpg?quality=82&width=750&format=webp",
  },
  {
    name: "Taylor 314ce V-Class",
    price: "$2,299.00",
    image: "https://media.sweetwater.com/m/products/image/00bd892379Sq23f6EBR8T8HvBcYs9YAESicgOubo.png",
  },
  {
    name: "Universal Audio Apollo Twin X",
    price: "$1,599.00",
    image: "https://media.sweetwater.com/m/products/image/052250cf73nOL3KRtEQEEmF9AByd84tPzCw64Ycd.jpg?quality=82&height=400",
  },
  {
    name: "Nord Stage 4",
    price: "$4,999.00",
    image: "https://media.sweetwater.com/m/products/image/d8c2bbdeccm3Y090lrRNsEkbuepCOgoAPS5sINA5.png",
  },
];

export default function NewArrivals() {
  return (
    <section className="sw-section border-b border-[var(--grey10)] bg-white">
      <div className="sw-container">
        <h2 className="sw-section-heading">Top New Products</h2>
        <p className="sw-section-subheading mb-8">
          The latest gear from the brands you trust.
        </p>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {arrivals.map((item) => (
            <ProductCard key={item.name} {...item} />
          ))}
        </div>
      </div>
    </section>
  );
}
