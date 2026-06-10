import { NEW_AND_NOTABLE } from "@/data/newAndNotable";
import NewAndNotableCard from "./NewAndNotableCard";

/** Second tile-block inside `#sales-events` (Drum Month / New & Notable carousel). */
export default function NewAndNotable() {
  const { sliderId, accentLabel, heading, items } = NEW_AND_NOTABLE;

  return (
    <section className="tile-block borderless">
      <div className="section-header">
        <span className="accent-text text-red">{accentLabel}</span>
        <h2 className="bg-gray50 text-black text-center">{heading}</h2>
        <span className="accent bg-red"></span>
      </div>

      <div
        id={sliderId}
        className="tiles tiles--multi flex-container flex-row flex-nowrap scrollbar-minimal horizontal cols-4 tile-peak-4"
      >
        {items.map((item) => (
          <NewAndNotableCard key={item.id} item={item} />
        ))}
      </div>

      <div
        data-prev-id={sliderId}
        className="tile--slider-controls prev bg-white"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40">
          <g fill="none" stroke="#000" strokeLinecap="round" strokeWidth="2">
            <g></g>
            <path d="M22.238 12.495l-7.739 7.739 7.739 7.739" fill="none" />
          </g>
        </svg>
      </div>
      <div
        data-next-id={sliderId}
        className="tile--slider-controls next bg-white"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40">
          <g fill="none" stroke="#000" strokeLinecap="round" strokeWidth="2">
            <g transform="rotate(180 20 20)"></g>
            <path d="M17.762 27.505l7.739-7.739-7.739-7.739" fill="none" />
          </g>
        </svg>
      </div>
    </section>
  );
}
