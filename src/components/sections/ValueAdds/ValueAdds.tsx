import { VALUE_ADDS } from "@/data/valueAdds";
import ValueAddCard from "./ValueAddCard";

/** Homepage value proposition grid (`#value-adds`). */
export default function ValueAdds() {
  const { sectionId, heading, items } = VALUE_ADDS;

  return (
    <section id={sectionId} className="value-ads">
      <h2>{heading}</h2>
      <div className="value-ads--links">
        {items.map((item) => (
          <ValueAddCard key={item.id} item={item} />
        ))}
      </div>
    </section>
  );
}
