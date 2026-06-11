import Link from "next/link";
import { RESEARCH_ARTICLES } from "@/data/researchArticles";
import { resolveLinkHref } from "@/lib/routes";
import ResearchArticleCard from "./ResearchArticleCard";

/** Homepage inSync research grid (`#research-articles`). */
export default function ResearchArticles() {
  const { sectionId, heading, hero, featuredArticle, articles } =
    RESEARCH_ARTICLES;

  return (
    <section id={sectionId} className="insync-home">
      <h2>{heading}</h2>
      <div className="insync-grid">
        <div className="insync-grid--hero " data-ll-loaded="true">
          <img
            src={hero.logoSrc}
            alt={hero.logoAlt}
            width={hero.logoWidth}
            height={hero.logoHeight}
            loading="lazy"
          />
          <br />
          <br />
          {hero.copy}
          <br />
          <br />
          <Link
            href={resolveLinkHref(hero.ctaHref)}
            className="sw-btn__lg sw-btn-white__outline"
            data-hp-section="insync"
            data-hp-slot={hero.hpSlot}
          >
            {hero.ctaLabel}
          </Link>
        </div>

        <ResearchArticleCard item={featuredArticle} variant="featured" />

        {articles.map((article) => (
          <ResearchArticleCard
            key={article.id}
            item={article}
            variant="article"
          />
        ))}
      </div>
    </section>
  );
}
