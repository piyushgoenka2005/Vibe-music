export default function AccountOrderDetailLoading() {
  return (
    <div className="acct__order-detail" aria-busy="true" aria-label="Loading order">
      <div className="acct__order-detail-top">
        <div className="acct__skeleton acct__skeleton--link" />
        <div className="acct__order-detail-heading">
          <div className="acct__skeleton-block">
            <div className="acct__skeleton acct__skeleton--title" />
            <div className="acct__skeleton acct__skeleton--text" />
          </div>
          <div className="acct__skeleton acct__skeleton--badge" />
        </div>
      </div>

      <div className="acct__order-detail-actions">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="acct__skeleton acct__skeleton--button" />
        ))}
      </div>

      <div className="acct__order-detail-grid">
        <div className="acct__card">
          <div className="acct__card-body acct__skeleton-stack">
            {Array.from({ length: 6 }, (_, index) => (
              <div key={index} className="acct__skeleton acct__skeleton--row" />
            ))}
          </div>
        </div>
        <div className="acct__card">
          <div className="acct__card-body acct__skeleton-stack">
            <div className="acct__skeleton acct__skeleton--text-lg" />
            <div className="acct__skeleton acct__skeleton--text" />
            <div className="acct__skeleton acct__skeleton--text" />
          </div>
        </div>
      </div>

      <div className="acct__card acct__card--spaced">
        <div className="acct__card-body acct__skeleton-stack">
          {Array.from({ length: 3 }, (_, index) => (
            <div key={index} className="acct__skeleton acct__skeleton--item" />
          ))}
        </div>
      </div>
    </div>
  );
}
