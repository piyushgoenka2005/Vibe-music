export default function AccountOrdersLoading() {
  return (
    <div aria-busy="true" aria-label="Loading orders">
      <div className="acct__skeleton acct__skeleton--title" />
      <div className="acct__skeleton acct__skeleton--text" style={{ marginTop: 8 }} />
      <div className="acct__card" style={{ marginTop: 24 }}>
        <div className="acct__card-body acct__skeleton-stack">
          {Array.from({ length: 3 }, (_, index) => (
            <div key={index} className="acct__skeleton acct__skeleton--item" />
          ))}
        </div>
      </div>
    </div>
  );
}
