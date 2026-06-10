import { POPULAR_CATEGORY_ITEMS } from "@/data/popularCategories";
import CategoryCard from "./CategoryCard";

export default function PopularCategories() {
  return (
    <section id="popular-categories" className="popular-categories">
      <h2>Popular Categories</h2>
      <div className="popcat-grid">
        {POPULAR_CATEGORY_ITEMS.map((item) => (
          <CategoryCard key={item.slot} item={item} />
        ))}
      </div>
    </section>
  );
}
