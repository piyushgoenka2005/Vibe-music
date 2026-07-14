import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import Reveal from "@/components/layout/Reveal";
import BigNamesDealsShowcase from "@/components/home/BigNamesDealsShowcase";
import { BIG_NAMES_DEALS, BIG_NAMES_DEALS_CTA } from "@/data/bigNamesDeals";

const HEADLINE_ID = "bigNamesDealsHeadline";

export default function BigNamesDealsSection() {
  return (
    <section className="big-names-deals" aria-labelledby={HEADLINE_ID}>
      <div className="big-names-deals__inner">
        <header className="big-names-deals__header">
          <Reveal immediate>
            <p className="big-names-deals__eyebrow">
              <span className="big-names-deals__eyebrow-line" aria-hidden />
              Shop top brands
              <span className="big-names-deals__eyebrow-line" aria-hidden />
            </p>
          </Reveal>

          <Reveal immediate delay={40}>
            <h1
              className="big-names-deals__headline typo-series"
              id={HEADLINE_ID}
            >
              Big names. Serious savings.
            </h1>
          </Reveal>

          <Reveal immediate delay={80}>
            <h2 className="big-names-deals__subtitle">
              <span className="big-names-deals__subtitle-line">
                Find all the top brands you already love, at prices that simply
              </span>
              <span className="big-names-deals__subtitle-line">
                can&apos;t be beat
              </span>
            </h2>
          </Reveal>
        </header>

        <BigNamesDealsShowcase items={BIG_NAMES_DEALS} />

        <Reveal delay={120}>
          <div className="big-names-deals__cta-wrap">
            <Link className="big-names-deals__cta" href={BIG_NAMES_DEALS_CTA}>
              Shop All Deals
              <span className="big-names-deals__cta-arrow" aria-hidden>
                <ArrowUpRight size={23} strokeWidth={2.75} />
              </span>
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
