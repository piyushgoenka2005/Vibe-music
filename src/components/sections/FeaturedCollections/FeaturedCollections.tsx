import CollectionCard from "./CollectionCard";

const collections = [
  "Professional Recording",
  "Live Performance",
  "Home Studio",
  "Beginner Essentials",
];

export default function FeaturedCollections() {
  return (
    <section className="py-16 bg-[#f7f8fa]">

      <div className="max-w-[1440px] mx-auto px-4">

        <h2 className="text-4xl font-bold mb-10">
          Featured Collections
        </h2>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">

          {collections.map((collection) => (
            <CollectionCard
              key={collection}
              title={collection}
            />
          ))}

        </div>

      </div>

    </section>
  );
}