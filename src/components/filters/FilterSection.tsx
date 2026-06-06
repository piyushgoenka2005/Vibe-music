interface FilterSectionProps {
  title: string;
  children: React.ReactNode;
}

export default function FilterSection({ title, children }: FilterSectionProps) {
  return (
    <section className="cat-filter-section" aria-label={title}>
      <h3 className="cat-filter-section__title">{title}</h3>
      {children}
    </section>
  );
}
