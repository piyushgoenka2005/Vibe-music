export default function Loading() {
  return (
    <main
      className="storefront-page storefront-page--subtle"
      aria-busy="true"
      aria-label="Loading"
    >
      <div className="page-skeleton">
        <div className="page-skeleton__line page-skeleton__line--title" />
        <div className="page-skeleton__line" />
        <div className="page-skeleton__line page-skeleton__line--short" />
      </div>
    </main>
  );
}
