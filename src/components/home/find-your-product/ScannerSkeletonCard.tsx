export default function ScannerSkeletonCard() {
  return (
    <div className="scanner-card-wrap" aria-hidden>
      <div className="scanner-card scanner-card--empty">
        <span className="scanner-card__empty-thumb" />
        <span className="scanner-card__empty-line scanner-card__empty-line--wide" />
        <span className="scanner-card__empty-line scanner-card__empty-line--short" />
        <span className="scanner-card__empty-line scanner-card__empty-line--stat" />
        <span className="scanner-card__empty-divider" aria-hidden />
      </div>
    </div>
  );
}
