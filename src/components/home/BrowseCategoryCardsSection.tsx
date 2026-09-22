import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { getBrowseByCategoriesPublicData } from "@/lib/server/homepageService";
import BrowseCategoryCardsSlider from "@/components/home/BrowseCategoryCardsSlider";
import Reveal from "@/components/layout/Reveal";
import type { BrowseCategoryCard } from "@/data/browseCategoryCards";
import { resolveLinkHref } from "@/lib/routes";

const HEADLINE_ID = "browse-category-cards-title";

function ViewAllGearLabel({ label }: { label: string }) {
  return (
    <>
      {label}
      <span className="category-cards-container__button-arrow" aria-hidden>
        <ArrowUpRight size={16} strokeWidth={2.5} />
      </span>
    </>
  );
}

export default async function BrowseCategoryCardsSection() {
  const data = await getBrowseByCategoriesPublicData();
  if (!data.isActive || data.items.length === 0) return null;

  const cards: BrowseCategoryCard[] = data.items.map((item) => ({
    id: item.id,
    title: item.title,
    href: resolveLinkHref(item.href),
    image: item.imageSrc.split("?")[0],
    srcSet: `${item.imageSrc.split("?")[0]} 800w`,
    width: 800,
    height: 600,
  }));

  const ctaHref = resolveLinkHref(data.ctaLink);
  const ctaLabel = data.ctaText || "View All Gear";

  return (
    <Reveal
      as="section"
      className="browse-category-cards category-cards-container"
      aria-labelledby={HEADLINE_ID}
    >
      <div className="category-cards-container__header page-width">
        <div className="category-cards-container__header-content">
          <h2 className="category-cards-container__title" id={HEADLINE_ID}>
            {data.title}
          </h2>
        </div>

        <div className="category-cards-container__cta category-cards-container__cta--desktop">
          <Link className="category-cards-container__button" href={ctaHref}>
            <ViewAllGearLabel label={ctaLabel} />
          </Link>
        </div>
      </div>

      <div className="page-width">
        <BrowseCategoryCardsSlider items={cards} />
      </div>

      <div className="category-cards-container__cta category-cards-container__cta--mobile page-width">
        <Link className="category-cards-container__button" href={ctaHref}>
          <ViewAllGearLabel label={ctaLabel} />
        </Link>
      </div>
    </Reveal>
  );
}
