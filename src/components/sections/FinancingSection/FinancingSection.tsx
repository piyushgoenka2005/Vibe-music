export default function FinancingSection() {
  return (
    <section className="sw-section border-b border-[var(--grey10)] bg-[var(--grey0)]">
      <div className="sw-container">
        <div className="grid items-center gap-8 rounded border border-[var(--grey10)] bg-white p-6 lg:grid-cols-[180px_1fr_auto] lg:p-8">
          <img
            src="/images/m/home/easy-pay.png"
            alt="ViBE financing card"
            className="mx-auto w-[140px] lg:mx-0"
          />

          <div>
            <h2 className="mb-2 text-xl font-semibold text-[var(--grey100)]">
              Special Financing!
            </h2>
            <p className="text-[15px] leading-relaxed text-[var(--grey60)]">
              Now is the perfect time to get the gear you want with simple,
              promotional financing.
            </p>
          </div>

          <a
            href="#"
            className="inline-flex items-center gap-2 whitespace-nowrap text-[15px] font-semibold text-[var(--blue)] hover:text-[var(--blue60)]"
          >
            Take me there
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 299 512" aria-hidden="true" height="14" width="14" fill="currentColor">
              <path d="M262.827 288.726l32.128-32.171L37.462-.938l-32.17 32.17 225.28 225.28L6.401 480.853l32.128 32.128 224.298-224.256z" />
            </svg>
          </a>
        </div>
      </div>
    </section>
  );
}
