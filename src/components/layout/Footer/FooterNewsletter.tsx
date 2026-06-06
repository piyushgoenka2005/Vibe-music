export default function FooterNewsletter() {
  return (
    <div className="rounded border border-[var(--grey80)] bg-[var(--grey90)] p-6">
      <p className="mb-1 text-lg font-semibold">Sign Up For Email Offers!</p>
      <p className="mb-4 text-sm text-[var(--grey20)]">
        Exclusive deals, delivered straight to your inbox.
      </p>

      <form className="flex flex-col gap-3 sm:flex-row">
        <input
          type="email"
          placeholder="Enter your email address"
          aria-label="Enter your email address"
          className="h-11 flex-1 rounded border border-[var(--grey70)] bg-white px-4 text-[var(--grey100)] outline-none focus:border-[var(--blue)]"
        />
        <button type="submit" className="sw-btn sw-btn-blue h-11 px-8">
          Subscribe
        </button>
      </form>
    </div>
  );
}
