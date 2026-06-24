interface ShopByCategoryHeaderProps {
  titleId?: string;
  className?: string;
}

export default function ShopByCategoryHeader({
  titleId = "shop-by-category-title",
  className = "",
}: ShopByCategoryHeaderProps) {
  return (
    <header
      className={`shop-by-category-header category-bento__header${className ? ` ${className}` : ""}`}
    >
      <p className="category-bento__eyebrow">
        <span className="category-bento__eyebrow-line" aria-hidden />
        Shop by category
        <span className="category-bento__eyebrow-line" aria-hidden />
      </p>
      <h2 id={titleId} className="category-bento__title">
        Find Your Product
      </h2>
      <p className="category-bento__subtitle">
        Curated departments for every stage — from bedroom studio to main stage.
      </p>
    </header>
  );
}
