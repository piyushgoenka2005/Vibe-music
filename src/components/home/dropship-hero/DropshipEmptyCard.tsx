export default function DropshipEmptyCard() {
  return (
    <div className="dropship-marquee-card-wrap" aria-hidden>
      <div className="dropship-product-card dropship-product-card--empty">
        <span className="dropship-card-empty-thumb" />
        <span className="dropship-card-empty-line dropship-card-empty-line--wide" />
        <span className="dropship-card-empty-line dropship-card-empty-line--short" />
        <span className="dropship-card-empty-line dropship-card-empty-line--stat" />
        <span className="dropship-card-empty-divider" aria-hidden />
      </div>
    </div>
  );
}
