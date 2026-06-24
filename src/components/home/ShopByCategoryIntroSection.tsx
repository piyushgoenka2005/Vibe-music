import ShopByCategoryHeader from "@/components/home/ShopByCategoryHeader";

export default function ShopByCategoryIntroSection() {
  return (
    <section
      className="shop-by-category-intro"
      aria-labelledby="shop-by-category-intro-title"
      data-vibe-section="shop-by-category-intro"
    >
      <div className="shop-by-category-intro__inner">
        <ShopByCategoryHeader titleId="shop-by-category-intro-title" />
      </div>
    </section>
  );
}
