import Link from "next/link";
import {
  BROWSE_CATEGORY_CARDS,
  BROWSE_CATEGORY_CARDS_CTA,
} from "@/data/browseCategoryCards";
import BrowseCategoryCardsSlider from "@/components/home/BrowseCategoryCardsSlider";
import Reveal from "@/components/layout/Reveal";

const HEADLINE_ID = "browse-category-cards-title";

export default function BrowseCategoryCardsSection() {
  return (
    <Reveal
      as="section"
      className="browse-category-cards category-cards-container"
      aria-labelledby={HEADLINE_ID}
    >
      <div className="category-cards-container__header page-width">
        <div className="category-cards-container__header-content">
          <h2 className="category-cards-container__title" id={HEADLINE_ID}>
            Browse by Categories
          </h2>
        </div>

        <div className="category-cards-container__cta category-cards-container__cta--desktop">
          <Link
            className="category-cards-container__button"
            href={BROWSE_CATEGORY_CARDS_CTA}
          >
            View All Gear
          </Link>
        </div>
      </div>

      <div className="page-width">
        <BrowseCategoryCardsSlider items={BROWSE_CATEGORY_CARDS} />
      </div>

      <div className="category-cards-container__cta category-cards-container__cta--mobile page-width">
        <Link
          className="category-cards-container__button"
          href={BROWSE_CATEGORY_CARDS_CTA}
        >
          View All Gear
        </Link>
      </div>
    </Reveal>
  );
}
