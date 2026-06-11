import Link from "next/link";
import { SALES_ENGINEER } from "@/data/salesEngineer";
import { resolveLinkHref } from "@/lib/routes";
import SalesEngineerCard from "./SalesEngineerCard";

const PHONE_ICON = (
  <svg
    className="sw--svg"
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 17 32"
    height="16"
    width="16"
    aria-hidden="true"
  >
    <path
      fillRule="evenodd"
      d="M0 2.002C0 .896.89 0 2 0h13c1.105 0 2 .89 2 2.002v27.996C17 31.104 16.11 32 15 32H2c-1.105 0-2-.89-2-2.002V2.002zM2 6h13v20H2V6zm5-3h3v1H7V3zm1.5 27c.828 0 1.5-.672 1.5-1.5S9.328 27 8.5 27 7 27.672 7 28.5 7.672 30 8.5 30z"
    />
  </svg>
);

const CHAT_ICON = (
  <svg
    className="sw--svg"
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 32 32"
    height="16"
    width="16"
    aria-hidden="true"
  >
    <path d="M16 3C8.82 3 3 8.03 3 14.18c0 3.17 1.62 6.02 4.18 8.02L5 29l7.24-3.62c1.17.22 2.38.34 3.61.34 7.18 0 13-5.03 13-11.18S23.18 3 16 3z" />
  </svg>
);

/** Homepage Sales Engineer section (`#sales-engineer`). */
export default function SalesEngineer() {
  const {
    sectionId,
    heading,
    description,
    phoneDisplay,
    phoneHref,
    chatLabel,
    learnMoreHref,
    learnMoreLabel,
    slides,
  } = SALES_ENGINEER;

  return (
    <section
      id={sectionId}
      className="sales-engineer list-view"
      data-hp-section="sales-engineer"
    >
      <div className="se-generic">
        <div className="se-g--container">
          <div className="se-g--description">
            <h3>{heading}</h3>
            <div className="se-g--description-txt">
              <p>{description}</p>
            </div>
            <div className="se-g--description-btns">
              <a href={phoneHref} className="btn--large">
                {PHONE_ICON}
                Call {phoneDisplay}
              </a>
              <button
                type="button"
                className="btn--large"
                data-ada-live-chat
              >
                {CHAT_ICON}
                {chatLabel}
              </button>
            </div>
            <Link
              href={resolveLinkHref(learnMoreHref)}
              className="se-g--description-link"
            >
              {learnMoreLabel}
            </Link>
          </div>
          <div className="se-g--images">
            {slides.map((slide, index) => (
              <SalesEngineerCard
                key={slide.id}
                slide={slide}
                isCurrent={index === 0}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
