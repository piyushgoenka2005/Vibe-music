export default function AccountLoading() {
  return (
    <main
      className="storefront-page storefront-page--subtle"
      aria-busy="true"
      aria-label="Loading account"
    >
      <div className="mx-auto max-w-5xl animate-pulse space-y-6 px-4 py-8">
        <div className="h-32 rounded-xl bg-muted" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => (
            <div key={index} className="h-24 rounded-xl bg-muted" />
          ))}
        </div>
        <div className="h-48 rounded-xl bg-muted" />
      </div>
    </main>
  );
}
