const benefits = [
  {
    title: "Free Shipping",
    description: "Free shipping on thousands of items.",
    icon: "🚚",
  },
  {
    title: "Free Tech Support",
    description: "Expert help before and after your purchase.",
    icon: "🎧",
  },
  {
    title: "Easy Financing",
    description: "Flexible payment plans on qualifying gear.",
    icon: "💳",
  },
  {
    title: "Sales Engineers",
    description: "Real musicians ready to help you choose.",
    icon: "🎸",
  },
];

export default function WhyChooseUs() {
  return (
    <section className="sw-section border-b border-[var(--grey10)] bg-[var(--grey0)]">
      <div className="sw-container">
        <h2 className="sw-section-heading text-center">Get More At ViBE</h2>
        <p className="sw-section-subheading mb-10 text-center">
          The extras that make shopping with us different.
        </p>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {benefits.map((benefit) => (
            <div
              key={benefit.title}
              className="rounded border border-[var(--grey10)] bg-white p-6 text-center"
            >
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--grey0)] text-2xl">
                {benefit.icon}
              </div>
              <h3 className="mb-2 text-base font-semibold text-[var(--grey100)]">
                {benefit.title}
              </h3>
              <p className="text-sm leading-relaxed text-[var(--grey60)]">
                {benefit.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
