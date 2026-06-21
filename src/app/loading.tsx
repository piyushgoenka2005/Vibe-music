export default function Loading() {
  return (
    <main
      className="storefront-page storefront-page--subtle"
      aria-busy="true"
      aria-label="Loading"
    >
      <div className="storefront-loading">Loading…</div>
    </main>
  );
}
