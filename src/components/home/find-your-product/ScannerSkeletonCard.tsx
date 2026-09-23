export default function ScannerSkeletonCard() {
  return (
    <div className="scanner-card-wrap" aria-hidden>
      <div className="scanner-card scanner-card--empty">
        <span className="scanner-card__empty-thumb" />
        <div className="scanner-card__body">
          <span className="scanner-card__empty-line scanner-card__empty-line--title" />
          <span className="scanner-card__empty-line scanner-card__empty-line--price" />
        </div>
      </div>
    </div>
  );
}
